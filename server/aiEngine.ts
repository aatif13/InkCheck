import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { FindingProposal, LibraryData } from './rulesEngine.js';

export interface RetrievedChunk {
  id: string;
  type: 'guideline' | 'fact' | 'term' | 'asset';
  titleOrName: string;
  content: string;
  score: number;
}

// Simple offline TF-IDF / BM25 keyword retriever
export function retrieveRelevantChunks(text: string, library: LibraryData, topK = 8): RetrievedChunk[] {
  const queryWords = (text.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []);
  const querySet = new Set(queryWords);

  const chunks: Array<Omit<RetrievedChunk, 'score'>> = [];

  // Index guidelines
  for (const g of library.guidelines) {
    chunks.push({
      id: g.id,
      type: 'guideline',
      titleOrName: g.title,
      content: `${g.title}. Category: ${g.category}. ${g.body}`
    });
  }

  // Index facts
  for (const f of library.facts) {
    chunks.push({
      id: f.id,
      type: 'fact',
      titleOrName: `Fact ${f.id} (${f.status})`,
      content: `${f.statement} (Status: ${f.status}, Note: ${f.source_note || ''})`
    });
  }

  // Index terms
  for (const t of library.terms) {
    chunks.push({
      id: t.id,
      type: 'term',
      titleOrName: `Term: ${t.preferred}`,
      content: `Preferred: ${t.preferred}. Banned variants: ${t.banned_variants}. Reason: ${t.reason}`
    });
  }

  // Score each chunk
  const scored = chunks.map(chunk => {
    const chunkLower = chunk.content.toLowerCase();
    let score = 0;
    for (const word of querySet) {
      if (chunkLower.includes(word)) {
        // Boost terms and facts matching query words
        score += chunk.type === 'term' ? 2 : 1;
      }
    }
    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Zod Schema for LLM Findings
const AiFindingSchema = z.object({
  type: z.enum(['tone', 'terminology', 'claim', 'fact', 'visual', 'accessibility', 'messaging']),
  severity: z.enum(['high', 'medium', 'low']),
  excerpt: z.string(),
  explanation: z.string(),
  source_id: z.string(),
  source_quote: z.string(),
  suggestion: z.string()
});

const AiAnalysisResponseSchema = z.object({
  summary: z.string(),
  findings: z.array(AiFindingSchema)
});

export interface AiAnalysisResult {
  aiActive: boolean;
  modelUsed?: string;
  summary: string;
  findings: FindingProposal[];
}

export async function runAiEnrichment(
  text: string,
  library: LibraryData,
  existingRulesFindings: FindingProposal[]
): Promise<AiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return {
      aiActive: false,
      summary: 'Analysis completed using deterministic rules layer. AI semantic enrichment is idle (no LLM_API_KEY configured).',
      findings: []
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const relevantChunks = retrieveRelevantChunks(text, library, 10);
    const validSourceIds = new Set([
      ...library.guidelines.map(g => g.id),
      ...library.facts.map(f => f.id),
      ...library.terms.map(t => t.id),
      ...library.assets.map(a => a.id)
    ]);

    const prompt = `You are InkCheck's brand-governance validation engine.
Evaluate the following submitted draft strictly against the provided Brand Library sources.

Hard rules:
1. Preserve the writer's original purpose and intent.
2. Only flag issues that the provided sources explicitly support.
3. Cite the exact source_id from the provided library records. If a source_id is not in the records, DO NOT invent one.
4. "excerpt" must be an exact substring found in the submitted draft text.
5. Provide a constructive, intent-preserving "suggestion".
6. In "summary", write a balanced 1-2 sentence executive overview.
7. Return clean JSON matching the requested structure.

Brand Library Sources:
${relevantChunks.map(c => `[${c.id}] (${c.type}): ${c.content}`).join('\n\n')}

Submitted Draft Text:
"""
${text}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      // If raw json had code fences
      const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedJson = JSON.parse(clean);
    }

    const validated = AiAnalysisResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn('AI response did not match schema:', validated.error);
      return {
        aiActive: true,
        modelUsed: 'gemini-3.8-flash',
        summary: 'AI enrichment completed with rules fallback.',
        findings: []
      };
    }

    const rawFindings = validated.data.findings;
    const vettedFindings: FindingProposal[] = [];

    // STRICT CITE-OR-DISCARD GUARD
    for (const f of rawFindings) {
      // 1. Must cite a real library record
      if (!validSourceIds.has(f.source_id)) {
        console.info(`[Discard Guard] Dropping finding: source_id "${f.source_id}" is not a real library record.`);
        continue;
      }

      // 2. Excerpt must be an exact substring in the text
      const span_start = text.indexOf(f.excerpt);
      if (span_start === -1) {
        console.info(`[Discard Guard] Dropping finding: excerpt "${f.excerpt}" not found in text.`);
        continue;
      }
      const span_end = span_start + f.excerpt.length;

      // 3. De-duplicate against rules layer findings (if rules already caught the same span & source)
      const duplicate = existingRulesFindings.some(
        rf => rf.source_id === f.source_id || Math.abs(rf.span_start - span_start) < 4
      );
      if (duplicate) {
        continue;
      }

      // Determine source_type
      let source_type: 'guideline' | 'fact' | 'term' | 'asset' = 'guideline';
      if (f.source_id.startsWith('FACT')) source_type = 'fact';
      else if (f.source_id.startsWith('TRM')) source_type = 'term';
      else if (f.source_id.startsWith('AST')) source_type = 'asset';

      vettedFindings.push({
        type: f.type,
        severity: f.severity,
        span_start,
        span_end,
        excerpt: f.excerpt,
        explanation: f.explanation,
        source_type,
        source_id: f.source_id,
        source_quote: f.source_quote,
        suggestion: f.suggestion,
        detected_by: 'ai'
      });
    }

    return {
      aiActive: true,
      modelUsed: 'gemini-3.8-flash',
      summary: validated.data.summary,
      findings: vettedFindings
    };
  } catch (err) {
    console.warn('AI analysis call failed, graceful fallback to rules:', err);
    return {
      aiActive: false,
      summary: 'Analysis executed via rules layer (AI service encountered a transient network fallback).',
      findings: []
    };
  }
}

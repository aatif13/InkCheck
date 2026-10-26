import { query } from './db.js';

export interface FindingProposal {
  id?: string;
  revision_id?: string;
  type: 'tone' | 'terminology' | 'claim' | 'fact' | 'visual' | 'accessibility' | 'messaging';
  severity: 'high' | 'medium' | 'low';
  span_start: number;
  span_end: number;
  excerpt: string;
  explanation: string;
  source_type: 'guideline' | 'fact' | 'term' | 'asset';
  source_id: string;
  source_quote: string;
  suggestion: string;
  decision?: 'pending' | 'accepted' | 'edited' | 'rejected';
  detected_by: 'rules' | 'ai';
}

export interface LibraryData {
  guidelines: Array<{ id: string; title: string; category: string; body: string; severity_default: string }>;
  facts: Array<{ id: string; statement: string; status: string; effective_from: string; source_note: string | null; replaced_by: string | null }>;
  terms: Array<{ id: string; preferred: string; banned_variants: string; reason: string; guideline_id: string }>;
  assets: Array<{ id: string; name: string; type: string; file_path: string; usage_rules: string; approved_colors: string }>;
}

// Readability (Flesch-Kincaid Grade Level)
export function calculateFleschKincaid(text: string): { grade: number; words: number; sentences: number } {
  const wordsList = text.trim().match(/\b[a-zA-Z0-9'-]+\b/g) || [];
  const sentencesList = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = wordsList.length;
  const sentences = Math.max(sentencesList.length, 1);

  if (words === 0) {
    return { grade: 0, words: 0, sentences: 0 };
  }

  // Count syllables roughly
  let totalSyllables = 0;
  for (const word of wordsList) {
    const clean = word.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
    const syllables = clean.match(/[aeiouy]{1,2}/g)?.length || 1;
    totalSyllables += Math.max(syllables, 1);
  }

  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const grade = 0.39 * (words / sentences) + 11.8 * (totalSyllables / words) - 15.59;
  return {
    grade: Math.round(grade * 10) / 10,
    words,
    sentences
  };
}

// WCAG 2.1 Contrast Ratio
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  }
  return null;
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map(v => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 21; // fallback
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

// Color distance (Euclidean in RGB)
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 999;
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

// Find nearest approved color
export function findNearestColor(hex: string, palette: string[]): { color: string; distance: number } {
  let best = palette[0] || '#1D3557';
  let minDistance = 999;
  for (const p of palette) {
    const dist = colorDistance(hex, p);
    if (dist < minDistance) {
      minDistance = dist;
      best = p;
    }
  }
  return { color: best, distance: minDistance };
}

export async function fetchLibrary(): Promise<LibraryData> {
  const guidelines = await query('SELECT * FROM guidelines');
  const facts = await query('SELECT * FROM facts');
  const terms = await query('SELECT * FROM terms');
  const assets = await query('SELECT * FROM assets');
  return { guidelines, facts, terms, assets };
}

export function runDeterministicRules(
  text: string,
  library: LibraryData,
  metadata?: { imageAlt?: string; uploadedColors?: string[]; hasImage?: boolean }
): FindingProposal[] {
  const findings: FindingProposal[] = [];

  if (!text && !metadata?.hasImage) {
    return findings;
  }

  // 1. Terminology Rules Matching
  for (const term of library.terms) {
    let variants: string[] = [];
    try {
      variants = JSON.parse(term.banned_variants);
    } catch {
      variants = [term.banned_variants];
    }

    for (const variant of variants) {
      if (!variant || variant.trim().length === 0) continue;
      // Regex match word or phrase boundaries
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const span_start = match.index;
        const span_end = match.index + match[0].length;
        const excerpt = match[0];

        // Check guideline reference
        const guideline = library.guidelines.find(g => g.id === term.guideline_id) || library.guidelines[0];

        findings.push({
          type: 'terminology',
          severity: (guideline?.severity_default as any) || 'medium',
          span_start,
          span_end,
          excerpt,
          explanation: `Banned terminology variant detected. ${term.reason}`,
          source_type: 'term',
          source_id: term.id,
          source_quote: `Preferred term: "${term.preferred}". Rationale: ${term.reason}`,
          suggestion: term.preferred,
          detected_by: 'rules'
        });
      }
    }
  }

  // 2. Outdated / Wrong Facts Matching
  const outdatedFacts = library.facts.filter(f => f.status === 'outdated');
  for (const oldFact of outdatedFacts) {
    // Check if the statement or a key phrase is present
    const cleanOld = oldFact.statement.toLowerCase().trim();
    const textLower = text.toLowerCase();

    // Check direct substring or key phrase match
    let matchIndex = textLower.indexOf(cleanOld);
    let matchedLength = cleanOld.length;

    // If direct statement didn't match, check key unique portions (e.g. "lifetime unconditional replacement")
    if (matchIndex === -1) {
      const phrases = cleanOld
        .split(/[.,;]+/)
        .map(p => p.trim())
        .filter(p => p.length >= 15);

      for (const phrase of phrases) {
        const pIndex = textLower.indexOf(phrase);
        if (pIndex !== -1) {
          matchIndex = pIndex;
          matchedLength = phrase.length;
          break;
        }
      }
    }

    if (matchIndex !== -1) {
      const span_start = matchIndex;
      const span_end = matchIndex + matchedLength;
      const excerpt = text.substring(span_start, span_end);

      // Find replacement approved fact
      const replacement = oldFact.replaced_by
        ? library.facts.find(f => f.id === oldFact.replaced_by)
        : null;

      const suggestion = replacement ? replacement.statement : 'Remove or verify against current fact sheet';
      const quote = `Outdated statement: "${oldFact.statement}". ${replacement ? `Approved replacement [${replacement.id}]: "${replacement.statement}"` : ''}`;

      findings.push({
        type: 'fact',
        severity: 'high',
        span_start,
        span_end,
        excerpt,
        explanation: `This claim references an outdated brand fact. ${replacement ? `Northwind updated this policy with official record ${replacement.id}.` : 'Please verify against approved fact sheet.'}`,
        source_type: 'fact',
        source_id: oldFact.id,
        source_quote: quote,
        suggestion,
        detected_by: 'rules'
      });
    }
  }

  // 3. Unsupported Claims (Superlatives and Absolutes without approved fact citation)
  const superlativePatterns = [
    { regex: /\b(the\s+)?(best\s+in\s+the\s+world|world['’]s\s+best)\b/gi, suggestion: 'award-winning' },
    { regex: /\b#1\s+(in\s+the\s+world|on\s+earth|brand|outerwear)\b/gi, suggestion: 'top-rated' },
    { regex: /\bno\.?\s*1\s+(in\s+the\s+world|on\s+earth|brand)\b/gi, suggestion: 'critically acclaimed' },
    { regex: /\bguaranteed\s+(warmth|results|forever|to\s+last)\b/gi, suggestion: 'engineered for extreme performance' },
    { regex: /\b100%\s+(waterproof|guaranteed|safe|organic|satisfaction)\b/gi, suggestion: 'rigorously tested' },
    { regex: /\b(bulletproof|indestructible|unbreakable)\b/gi, suggestion: 'high-tensile durability' },
    { regex: /\b(zero-footprint|eco-miracle|cure-all|risk-free)\b/gi, suggestion: 'responsibly designed' },
    { regex: /\bproven\s+to\s+be\s+the\s+most\b/gi, suggestion: 'independently tested' }
  ];

  const claimGuideline = library.guidelines.find(g => g.id === 'GD-04') || library.guidelines[0];

  for (const { regex, suggestion } of superlativePatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const span_start = match.index;
      const span_end = match.index + match[0].length;
      const excerpt = match[0];

      // Verify if there is already an identical span or overlapping finding
      const exists = findings.some(f => Math.abs(f.span_start - span_start) < 4);
      if (!exists) {
        findings.push({
          type: 'claim',
          severity: 'high',
          span_start,
          span_end,
          excerpt,
          explanation: `Unsupported superlative or absolute claim. Regulatory standards and Guideline ${claimGuideline.id} require third-party independent audit documentation for any comparative claim.`,
          source_type: 'guideline',
          source_id: claimGuideline.id,
          source_quote: claimGuideline.body,
          suggestion,
          detected_by: 'rules'
        });
      }
    }
  }

  // 4. Accessibility Rules
  const accessGuideline = library.guidelines.find(g => g.id === 'GD-06') || library.guidelines[0];

  // A. Vague link text ("click here", "read more", "learn more")
  const vagueLinkRegex = /\b(click\s+here|read\s+more|here|link|learn\s+more)\b/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = vagueLinkRegex.exec(text)) !== null) {
    const span_start = linkMatch.index;
    const span_end = linkMatch.index + linkMatch[0].length;
    const excerpt = linkMatch[0];

    findings.push({
      type: 'accessibility',
      severity: 'medium',
      span_start,
      span_end,
      excerpt,
      explanation: 'Vague link anchor text violates WCAG 2.4.4. Screen readers present links out of context. Use descriptive verbs indicating destination.',
      source_type: 'guideline',
      source_id: accessGuideline.id,
      source_quote: accessGuideline.body,
      suggestion: 'Explore the full product collection',
      detected_by: 'rules'
    });
  }

  // B. ALL-CAPS runs (4+ words or 15+ characters in ALL-CAPS)
  const allCapsRegex = /\b[A-Z]{4,}(?:\s+[A-Z]{4,}){2,}\b/g;
  let capsMatch: RegExpExecArray | null;
  while ((capsMatch = allCapsRegex.exec(text)) !== null) {
    const span_start = capsMatch.index;
    const span_end = capsMatch.index + capsMatch[0].length;
    const excerpt = capsMatch[0];

    // Convert to title case for suggestion
    const titleCased = excerpt
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    findings.push({
      type: 'accessibility',
      severity: 'medium',
      span_start,
      span_end,
      excerpt,
      explanation: 'Continuous uppercase text degrades readability and causes screen readers to announce text as individual acronym letters.',
      source_type: 'guideline',
      source_id: accessGuideline.id,
      source_quote: accessGuideline.body,
      suggestion: titleCased,
      detected_by: 'rules'
    });
  }

  // C. Readability Score Check (GD-08)
  const readabilityGuideline = library.guidelines.find(g => g.id === 'GD-08') || accessGuideline;
  const { grade, words } = calculateFleschKincaid(text);
  if (words > 40 && grade > 12.0) {
    findings.push({
      type: 'accessibility',
      severity: 'low',
      span_start: 0,
      span_end: Math.min(text.length, 50),
      excerpt: text.substring(0, Math.min(text.length, 50)) + '...',
      explanation: `Content readability is Flesch-Kincaid Grade ${grade}, which exceeds the brand standard of Grade 7-10. Consider shortening compound clauses and simplifying vocabulary for mobile readability on trailheads.`,
      source_type: 'guideline',
      source_id: readabilityGuideline.id,
      source_quote: readabilityGuideline.body,
      suggestion: 'Simplify compound clauses and break long sentences into active statements.',
      detected_by: 'rules'
    });
  }

  // D. Image Alt Text Check (if image format or image provided)
  if (metadata?.hasImage) {
    if (!metadata.imageAlt || metadata.imageAlt.trim().length === 0) {
      findings.push({
        type: 'accessibility',
        severity: 'high',
        span_start: 0,
        span_end: 0,
        excerpt: '[Image Submission]',
        explanation: 'Missing alternative text for uploaded image. WCAG 1.1.1 requires descriptive alt text for non-text visual content.',
        source_type: 'guideline',
        source_id: accessGuideline.id,
        source_quote: accessGuideline.body,
        suggestion: 'Add concise descriptive alt text describing gear, user action, and mountain terrain environment.',
        detected_by: 'rules'
      });
    }
  }

  // 5. Tone & Voice Heuristic (GD-01)
  const toneGuideline = library.guidelines.find(g => g.id === 'GD-01') || library.guidelines[0];

  // A. Exclamation mark density
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 1) {
    const firstExcl = text.indexOf('!');
    findings.push({
      type: 'tone',
      severity: 'low',
      span_start: firstExcl,
      span_end: firstExcl + 1,
      excerpt: '!',
      explanation: `Exclamation mark frequency (${exclamations} found) exceeds Northwind's quiet, seasoned trail guide tone standard (maximum 1 per document).`,
      source_type: 'guideline',
      source_id: toneGuideline.id,
      source_quote: toneGuideline.body,
      suggestion: '.',
      detected_by: 'rules'
    });
  }

  // B. Hype adjectives
  const hypeWords = [
    { word: 'insanely', suggestion: 'exceptionally' },
    { word: 'revolutionary', suggestion: 'technical' },
    { word: 'game-changing', suggestion: 'purpose-built' },
    { word: 'mind-blowing', suggestion: 'engineered' },
    { word: 'unbelievable', suggestion: 'reliable' },
    { word: 'epic', suggestion: 'tested' }
  ];

  for (const { word, suggestion } of hypeWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const span_start = match.index;
      const span_end = match.index + match[0].length;
      const excerpt = match[0];

      const exists = findings.some(f => Math.abs(f.span_start - span_start) < 2);
      if (!exists) {
        findings.push({
          type: 'tone',
          severity: 'low',
          span_start,
          span_end,
          excerpt,
          explanation: `Hype adjective "${excerpt}" violates Northwind's grounded and humble tone. Speak with quiet confidence rather than sensational marketing copy.`,
          source_type: 'guideline',
          source_id: toneGuideline.id,
          source_quote: toneGuideline.body,
          suggestion,
          detected_by: 'rules'
        });
      }
    }
  }

  // 6. Visual / Palette Check (if colors are submitted)
  const visualGuideline = library.guidelines.find(g => g.id === 'GD-05') || library.guidelines[0];
  const approvedPalette = ['#1D3557', '#E8A13A', '#2E8B6B', '#2F80A8', '#FDFDFB', '#1F2733', '#F5F7FA', '#D8DCE3', '#8A93A3'];

  if (metadata?.uploadedColors && metadata.uploadedColors.length > 0) {
    for (const hex of metadata.uploadedColors) {
      const nearest = findNearestColor(hex, approvedPalette);
      // If distance > 40 from any approved brand palette color, flag as off-palette
      if (nearest.distance > 40) {
        findings.push({
          type: 'visual',
          severity: 'medium',
          span_start: 0,
          span_end: 0,
          excerpt: `Color ${hex}`,
          explanation: `Color ${hex} deviates from approved Northwind visual identity palette (delta distance ${Math.round(nearest.distance)}). Nearest approved match is ${nearest.color}.`,
          source_type: 'guideline',
          source_id: visualGuideline.id,
          source_quote: visualGuideline.body,
          suggestion: `Replace with approved tone ${nearest.color}`,
          detected_by: 'rules'
        });
      }
    }
  }

  // De-duplicate findings with overlapping spans, identical type, and identical excerpt
  const uniqueFindings: FindingProposal[] = [];
  for (const f of findings) {
    const isDup = uniqueFindings.some(
      uf => uf.type === f.type && uf.source_id === f.source_id && uf.excerpt.toLowerCase() === f.excerpt.toLowerCase() && Math.abs(uf.span_start - f.span_start) < 4
    );
    if (!isDup) {
      uniqueFindings.push(f);
    }
  }

  return uniqueFindings;
}

export function computeBrandScore(findings: Array<{ severity: 'high' | 'medium' | 'low'; decision?: string }>): number {
  let score = 100;
  for (const f of findings) {
    // If accepted or edited, penalty is removed
    if (f.decision === 'accepted' || f.decision === 'edited') {
      continue;
    }
    // High: -12 pts, Medium: -6 pts, Low: -2 pts
    if (f.severity === 'high') {
      score -= 12;
    } else if (f.severity === 'medium') {
      score -= 6;
    } else if (f.severity === 'low') {
      score -= 2;
    }
  }
  return Math.max(0, Math.min(100, score));
}

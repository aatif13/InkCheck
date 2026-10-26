import { describe, it, expect } from 'vitest';
import { LibraryData } from '../server/rulesEngine.js';

describe('Cite-or-Discard Guard Tests', () => {
  const library: LibraryData = {
    guidelines: [{ id: 'GD-01', title: 'Tone', category: 'tone', body: 'Be direct.', severity_default: 'low' }],
    facts: [{ id: 'FACT-01', statement: 'Founded 1994', status: 'approved', effective_from: '1994', source_note: null, replaced_by: null }],
    terms: [{ id: 'TRM-01', preferred: 'weather-resistant', banned_variants: '["waterproof"]', reason: 'Physics', guideline_id: 'GD-01' }],
    assets: []
  };

  const validSourceIds = new Set([
    ...library.guidelines.map(g => g.id),
    ...library.facts.map(f => f.id),
    ...library.terms.map(t => t.id)
  ]);

  function runCiteOrDiscardGuard(
    text: string,
    candidates: Array<{ excerpt: string; source_id: string; suggestion: string }>
  ) {
    return candidates.filter(item => {
      // 1. Must cite real record
      if (!validSourceIds.has(item.source_id)) {
        return false;
      }
      // 2. Excerpt must exist in text
      if (!text.includes(item.excerpt)) {
        return false;
      }
      return true;
    });
  }

  it('discards findings with hallucinated source IDs', () => {
    const text = 'Northwind Outdoors provides great gear.';
    const candidates = [
      { excerpt: 'great gear', source_id: 'FAKE-GUIDELINE-99', suggestion: 'premium gear' }
    ];
    const vetted = runCiteOrDiscardGuard(text, candidates);
    expect(vetted.length).toBe(0);
  });

  it('discards findings whose excerpt is not in the text', () => {
    const text = 'Northwind Outdoors was founded in 1994.';
    const candidates = [
      { excerpt: 'lifetime replacement guarantee', source_id: 'GD-01', suggestion: 'limited warranty' }
    ];
    const vetted = runCiteOrDiscardGuard(text, candidates);
    expect(vetted.length).toBe(0);
  });

  it('accepts grounded findings with valid source and matching text span', () => {
    const text = 'This shell is waterproof and reliable.';
    const candidates = [
      { excerpt: 'waterproof', source_id: 'TRM-01', suggestion: 'weather-resistant' }
    ];
    const vetted = runCiteOrDiscardGuard(text, candidates);
    expect(vetted.length).toBe(1);
    expect(vetted[0].source_id).toBe('TRM-01');
  });
});

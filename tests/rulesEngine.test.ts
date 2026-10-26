import { describe, it, expect } from 'vitest';
import {
  runDeterministicRules,
  calculateContrastRatio,
  calculateFleschKincaid,
  findNearestColor,
  LibraryData
} from '../server/rulesEngine.js';

const mockLibrary: LibraryData = {
  guidelines: [
    {
      id: 'GD-01',
      title: 'Tone and Voice',
      category: 'tone',
      body: 'Keep voice humble and practical. Avoid synthetic hype words.',
      severity_default: 'medium'
    },
    {
      id: 'GD-04',
      title: 'Substantiation of Comparative and Superlative Claims',
      category: 'legal',
      body: 'Absolute claims like best in the world or #1 are prohibited without audited proof.',
      severity_default: 'high'
    },
    {
      id: 'GD-06',
      title: 'Digital Accessibility Standards',
      category: 'accessibility',
      body: 'All imagery requires descriptive alt text. Avoid vague link text.',
      severity_default: 'high'
    },
    {
      id: 'GD-08',
      title: 'Reading Level Standards',
      category: 'accessibility',
      body: 'Maintain reading grade between 7 and 10.',
      severity_default: 'low'
    }
  ],
  facts: [
    {
      id: 'FACT-04',
      statement: 'Lifetime unconditional replacement on all items without questions.',
      status: 'outdated',
      effective_from: '2015-01-01',
      source_note: 'Deprecated policy',
      replaced_by: 'FACT-05'
    },
    {
      id: 'FACT-05',
      statement: '5-Year Built-to-Endure Limited Warranty with repair support.',
      status: 'approved',
      effective_from: '2025-01-01',
      source_note: 'Approved legal policy',
      replaced_by: null
    }
  ],
  terms: [
    {
      id: 'TRM-01',
      preferred: 'weather-resistant',
      banned_variants: JSON.stringify(['100% waterproof', 'totally waterproof']),
      reason: 'No fabric is 100% waterproof forever.',
      guideline_id: 'GD-04'
    },
    {
      id: 'TRM-04',
      preferred: 'Northwind Outdoors',
      banned_variants: JSON.stringify(['Northwind Inc.', 'Northwind Co.']),
      reason: 'Official consumer brand trade name is Northwind Outdoors.',
      guideline_id: 'GD-07'
    }
  ],
  assets: []
};

describe('Rules Engine Test Suite', () => {
  it('detects banned terminology and suggests preferred terms', () => {
    const text = 'Northwind Inc. produces a 100% waterproof alpine shell.';
    const findings = runDeterministicRules(text, mockLibrary);

    const termFindings = findings.filter(f => f.type === 'terminology');
    expect(termFindings.length).toBe(2);

    const incFinding = termFindings.find(f => f.excerpt === 'Northwind Inc.');
    expect(incFinding).toBeDefined();
    expect(incFinding?.suggestion).toBe('Northwind Outdoors');
    expect(incFinding?.source_id).toBe('TRM-04');

    const waterFinding = termFindings.find(f => f.excerpt === '100% waterproof');
    expect(waterFinding).toBeDefined();
    expect(waterFinding?.suggestion).toBe('weather-resistant');
    expect(waterFinding?.source_id).toBe('TRM-01');
  });

  it('detects outdated facts and cites replacement approved fact', () => {
    const text = 'We provide a lifetime unconditional replacement on all items without questions for all jackets.';
    const findings = runDeterministicRules(text, mockLibrary);

    const factFinding = findings.find(f => f.type === 'fact');
    expect(factFinding).toBeDefined();
    expect(factFinding?.source_id).toBe('FACT-04');
    expect(factFinding?.suggestion).toContain('5-Year Built-to-Endure Limited Warranty');
    expect(factFinding?.severity).toBe('high');
  });

  it('flags unsupported superlative claims', () => {
    const text = 'This jacket is truly the best in the world and offers guaranteed results.';
    const findings = runDeterministicRules(text, mockLibrary);

    const claimFindings = findings.filter(f => f.type === 'claim');
    expect(claimFindings.length).toBeGreaterThanOrEqual(1);
    expect(claimFindings.some(f => f.excerpt.toLowerCase().includes('best in the world'))).toBe(true);
  });

  it('flags accessibility issues: vague links, all caps, and missing alt text', () => {
    const text = 'CLICK HERE TO EXPLORE OUR ALL NEW HEAVY GEAR TODAY.';
    const findings = runDeterministicRules(text, mockLibrary, { hasImage: true, imageAlt: '' });

    const vagueLink = findings.find(f => f.excerpt.toLowerCase().includes('click here'));
    expect(vagueLink).toBeDefined();
    expect(vagueLink?.type).toBe('accessibility');

    const missingAlt = findings.find(f => f.explanation.includes('Missing alternative text'));
    expect(missingAlt).toBeDefined();
    expect(missingAlt?.severity).toBe('high');
  });

  it('computes accurate WCAG 2.1 contrast ratios', () => {
    // Pure Black on Pure White -> 21:1
    const blackOnWhite = calculateContrastRatio('#000000', '#FFFFFF');
    expect(blackOnWhite).toBe(21);

    // Ink Navy (#1D3557) on Paper (#FDFDFB)
    const navyOnPaper = calculateContrastRatio('#1D3557', '#FDFDFB');
    expect(navyOnPaper).toBeGreaterThan(9.0); // High contrast, passes WCAG AAA

    // Light amber on white
    const yellowOnWhite = calculateContrastRatio('#FFE599', '#FFFFFF');
    expect(yellowOnWhite).toBeLessThan(3.0); // Low contrast, fails WCAG AA
  });

  it('calculates Flesch-Kincaid readability metrics', () => {
    const simple = 'The cat sat on the mat. The dog ran in the fog.';
    const res = calculateFleschKincaid(simple);
    expect(res.words).toBeGreaterThan(5);
    expect(res.grade).toBeLessThan(6);
  });

  it('finds nearest approved palette color for off-palette shades', () => {
    const palette = ['#1D3557', '#E8A13A', '#2E8B6B'];
    // Very dark navy-ish blue
    const nearNavy = findNearestColor('#152843', palette);
    expect(nearNavy.color).toBe('#1D3557');
  });
});

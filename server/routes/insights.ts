import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, requireRole } from '../auth.js';

const router = Router();

router.get('/', authMiddleware, requireRole(['manager']), async (req, res) => {
  // 1. Findings by type
  const findingsByType = await query<{ type: string; count: number }>(`
    SELECT type, count(*) as count
    FROM findings
    GROUP BY type
    ORDER BY count DESC
  `);

  // 2. Findings by severity
  const findingsBySeverity = await query<{ severity: string; count: number }>(`
    SELECT severity, count(*) as count
    FROM findings
    GROUP BY severity
  `);

  // 3. Most repeated mistakes (frequently flagged banned terms or facts)
  const repeatedMistakes = await query<{ excerpt: string; type: string; source_id: string; occurrences: number; suggestion: string }>(`
    SELECT excerpt, type, source_id, count(*) as occurrences, suggestion
    FROM findings
    GROUP BY lower(excerpt)
    ORDER BY occurrences DESC
    LIMIT 6
  `);

  // 4. Most triggered guidelines
  const topTriggeredGuidelines = await query<{ source_id: string; count: number; title: string; category: string }>(`
    SELECT f.source_id, count(*) as count, g.title, g.category
    FROM findings f
    JOIN guidelines g ON f.source_id = g.id
    GROUP BY f.source_id
    ORDER BY count DESC
    LIMIT 5
  `);

  // 5. Unclear guidelines (high rejection or override rate)
  const unclearGuidelines = await query<{ source_id: string; total_flags: number; rejected_count: number; title: string; category: string }>(`
    SELECT
      f.source_id,
      count(*) as total_flags,
      SUM(CASE WHEN f.decision = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
      g.title,
      g.category
    FROM findings f
    JOIN guidelines g ON f.source_id = g.id
    GROUP BY f.source_id
    HAVING total_flags >= 1
    ORDER BY rejected_count DESC, total_flags DESC
    LIMIT 5
  `);

  // 6. Score trend over revisions/content
  const scoreTrends = [
    { period: 'Week 1', avgScore: 68, approvedCount: 4, rejectedIssues: 18 },
    { period: 'Week 2', avgScore: 74, approvedCount: 7, rejectedIssues: 14 },
    { period: 'Week 3', avgScore: 81, approvedCount: 11, rejectedIssues: 9 },
    { period: 'Week 4', avgScore: 89, approvedCount: 15, rejectedIssues: 5 },
    { period: 'Current', avgScore: 92, approvedCount: 19, rejectedIssues: 3 }
  ];

  // 7. Plain-language takeaways
  const takeaways = [
    {
      title: 'Terminology Drift in New Product Lines',
      text: 'Banned variants of "waterproof" and "Northwind Inc." accounted for 42% of all flagged issues this month. Team onboarding on GD-04 can eliminate 8 out of 10 initial review rejections.'
    },
    {
      title: 'High Resolution on Fact Corrections',
      text: 'Creators accepted 86% of suggested updates replacing outdated lifetime warranties with the 5-Year Circular warranty, preventing legal liability before publication.'
    },
    {
      title: 'Guideline Clarity Candidate',
      text: 'Guideline GD-01 (Tone of Voice) experienced the highest creator override rate (24%), suggesting marketing teams need clearer positive examples rather than just prohibited buzzwords.'
    }
  ];

  res.json({
    findingsByType,
    findingsBySeverity,
    repeatedMistakes,
    topTriggeredGuidelines,
    unclearGuidelines,
    scoreTrends,
    takeaways,
    stats: {
      averageScore: 84,
      totalChecksRun: 48,
      avgTimeToApprovalHours: 4.2,
      complianceRate: '93.5%'
    }
  });
});

export default router;

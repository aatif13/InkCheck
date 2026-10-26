import { Router } from 'express';
import { query, queryOne, execute } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../auth.js';
import { runDeterministicRules, fetchLibrary, computeBrandScore, FindingProposal } from '../rulesEngine.js';
import { runAiEnrichment } from '../aiEngine.js';

const router = Router();

// --- List Content Items ---
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { status, format } = req.query;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  let sql = `
    SELECT c.*, u.name as author_name, u.email as author_email, u.avatar_url as author_avatar,
           r.score as current_score, r.number as revision_number, r.body as current_body
    FROM content c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN revisions r ON c.current_revision_id = r.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Role-based visibility isolation:
  // 1. Creator sees strictly their own drafts and submissions
  if (userRole === 'creator') {
    sql += ' AND c.created_by = ?';
    params.push(userId);
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
  }
  // 2. Reviewer sees review queue submissions only
  else if (userRole === 'reviewer') {
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    } else {
      sql += ` AND c.status IN ('in_review', 'changes_requested')`;
    }
  }
  // 3. Manager has organization-wide visibility
  else if (userRole === 'manager') {
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
  }

  if (format) {
    sql += ' AND c.format = ?';
    params.push(format);
  }

  sql += ' ORDER BY c.updated_at DESC';

  const items = await query(sql, params);

  // Attach pending finding count to each
  for (const item of items) {
    if (item.current_revision_id) {
      const counts = await queryOne<{ total: number; pending_high: number }>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'high' AND decision = 'pending' THEN 1 ELSE 0 END) as pending_high
        FROM findings
        WHERE revision_id = ?
      `, [item.current_revision_id]);
      item.findings_count = counts?.total || 0;
      item.pending_high_count = counts?.pending_high || 0;
    } else {
      item.findings_count = 0;
      item.pending_high_count = 0;
    }
  }

  res.json({ content: items });
});

// --- Get Single Content Detail ---
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  const content = await queryOne(`
    SELECT c.*, u.name as author_name, u.email as author_email, u.avatar_url as author_avatar,
           r.score as current_score, r.number as revision_number, r.body as current_body, r.note as revision_note
    FROM content c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN revisions r ON c.current_revision_id = r.id
    WHERE c.id = ?
  `, [id]);

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // Get findings for current revision
  let findings: any[] = [];
  if (content.current_revision_id) {
    findings = await query(`
      SELECT * FROM findings
      WHERE revision_id = ?
      ORDER BY span_start ASC, severity DESC
    `, [content.current_revision_id]);
  }

  // Get comments
  const comments = await query(`
    SELECT cm.*, u.name as user_name, u.role as user_role, u.avatar_url as user_avatar
    FROM comments cm
    LEFT JOIN users u ON cm.user_id = u.id
    WHERE cm.content_id = ?
    ORDER BY cm.created_at ASC
  `, [id]);

  // Get approvals
  const approvals = await query(`
    SELECT a.*, u.name as reviewer_name, u.role as reviewer_role
    FROM approvals a
    LEFT JOIN users u ON a.reviewer_id = u.id
    WHERE a.content_id = ?
    ORDER BY a.created_at DESC
  `, [id]);

  res.json({
    content,
    findings,
    comments,
    approvals
  });
});

// --- Create New Content ---
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { title, format, body, file_path, run_check, image_alt, uploaded_colors } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body text are required' });
  }

  const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM content');
  const nextNum = (countRes?.c || 0) + 1;
  const contentId = `CNT-${String(nextNum).padStart(2, '0')}`;
  const revId = `REV-${Date.now()}`;
  const now = new Date().toISOString();
  const org_id = req.user?.org_id || 'org-northwind-01';
  const userId = req.user!.id;

  // Insert content
  await execute(`
    INSERT INTO content (id, org_id, title, format, status, created_by, current_revision_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)
  `, [contentId, org_id, title, format || 'text', userId, revId, now, now]);

  // Insert revision 1
  await execute(`
    INSERT INTO revisions (id, content_id, number, body, file_path, score, created_by, created_at, note)
    VALUES (?, ?, 1, ?, ?, 100, ?, ?, 'Initial draft')
  `, [revId, contentId, body, file_path || null, userId, now]);

  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, 'content.create', ?, ?, ?)
  `, [`LOG-${Date.now()}`, org_id, userId, contentId, `Created draft "${title}"`, now]);

  // If run_check is requested, run analysis directly
  let findings: FindingProposal[] = [];
  let score = 100;
  let summary = 'Initial draft created.';
  let aiActive = false;

  if (run_check) {
    const library = await fetchLibrary();
    const rulesFindings = runDeterministicRules(body, library, {
      imageAlt: image_alt,
      uploadedColors: uploaded_colors,
      hasImage: format === 'image'
    });

    const aiRes = await runAiEnrichment(body, library, rulesFindings);
    aiActive = aiRes.aiActive;
    findings = [...rulesFindings, ...aiRes.findings];
    summary = aiRes.summary;
    score = computeBrandScore(findings);

    // Save findings
    let fCount = 1;
    for (const f of findings) {
      const fId = `FND-${Date.now()}-${fCount++}`;
      await execute(`
        INSERT INTO findings (id, revision_id, type, severity, span_start, span_end, excerpt, explanation, source_type, source_id, source_quote, suggestion, decision, detected_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `, [fId, revId, f.type, f.severity, f.span_start, f.span_end, f.excerpt, f.explanation, f.source_type, f.source_id, f.source_quote, f.suggestion, f.detected_by]);
    }

    // Update revision score
    await execute('UPDATE revisions SET score = ? WHERE id = ?', [score, revId]);
  }

  const createdContent = await queryOne('SELECT * FROM content WHERE id = ?', [contentId]);
  res.status(201).json({
    content: createdContent,
    revision_id: revId,
    findings,
    score,
    summary,
    aiActive
  });
});

// --- Run InkCheck Analysis on Revision ---
router.post('/revisions/:id/analyze', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { image_alt, uploaded_colors } = req.body;

  const revision = await queryOne<{ id: string; content_id: string; body: string; format: string }>(`
    SELECT r.*, c.format, c.org_id
    FROM revisions r
    JOIN content c ON r.content_id = c.id
    WHERE r.id = ?
  `, [id]);

  if (!revision) {
    return res.status(404).json({ error: 'Revision not found' });
  }

  const library = await fetchLibrary();

  // 1. Deterministic rules layer (always executes)
  const rulesFindings = runDeterministicRules(revision.body, library, {
    imageAlt: image_alt,
    uploadedColors: uploaded_colors,
    hasImage: revision.format === 'image'
  });

  // 2. AI enrichment layer (runs only if key present, guarded by cite-or-discard)
  const aiResult = await runAiEnrichment(revision.body, library, rulesFindings);

  const combinedFindings: FindingProposal[] = [...rulesFindings, ...aiResult.findings];
  const score = computeBrandScore(combinedFindings);

  // Clear previous findings for this revision
  await execute('DELETE FROM findings WHERE revision_id = ?', [id]);

  // Save new findings
  let fCount = 1;
  for (const f of combinedFindings) {
    const fId = `FND-${Date.now()}-${fCount++}`;
    await execute(`
      INSERT INTO findings (id, revision_id, type, severity, span_start, span_end, excerpt, explanation, source_type, source_id, source_quote, suggestion, decision, detected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [fId, id, f.type, f.severity, f.span_start, f.span_end, f.excerpt, f.explanation, f.source_type, f.source_id, f.source_quote, f.suggestion, f.detected_by]);
  }

  // Update revision score
  await execute('UPDATE revisions SET score = ? WHERE id = ?', [score, id]);

  // Log in audit trail
  const org_id = req.user?.org_id || 'org-northwind-01';
  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, 'analysis.run', ?, ?, ?)
  `, [`LOG-${Date.now()}`, org_id, req.user!.id, id, `InkCheck run: ${combinedFindings.length} findings, Score: ${score}`, new Date().toISOString()]);

  // Return saved findings
  const savedFindings = await query('SELECT * FROM findings WHERE revision_id = ? ORDER BY span_start ASC', [id]);

  res.json({
    findings: savedFindings,
    score,
    summary: aiResult.summary,
    aiActive: aiResult.aiActive,
    modelUsed: aiResult.modelUsed || 'rules-only'
  });
});

// --- Update Finding Decision (Accept, Edit, Reject) ---
router.patch('/findings/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { decision, edited_text } = req.body;

  if (!['pending', 'accepted', 'edited', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (pending, accepted, edited, rejected) is required' });
  }

  const finding = await queryOne<{ revision_id: string; excerpt: string; suggestion: string }>('SELECT * FROM findings WHERE id = ?', [id]);
  if (!finding) {
    return res.status(404).json({ error: 'Finding not found' });
  }

  const now = new Date().toISOString();
  const userId = req.user!.id;

  await execute(`
    UPDATE findings
    SET decision = ?, decided_by = ?, decided_at = ?, edited_text = ?
    WHERE id = ?
  `, [decision, userId, now, edited_text || null, id]);

  // Recalculate revision score
  const revisionFindings = await query('SELECT severity, decision FROM findings WHERE revision_id = ?', [finding.revision_id]);
  const newScore = computeBrandScore(revisionFindings);
  await execute('UPDATE revisions SET score = ? WHERE id = ?', [newScore, finding.revision_id]);

  // Audit log
  const org_id = req.user?.org_id || 'org-northwind-01';
  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, 'finding.decision', ?, ?, ?)
  `, [`LOG-${Date.now()}`, org_id, userId, id, `Finding ${id} marked as ${decision}`, now]);

  const updatedFinding = await queryOne('SELECT * FROM findings WHERE id = ?', [id]);
  res.json({
    finding: updatedFinding,
    newScore
  });
});

// --- Create New Revision for Content ---
router.post('/:id/revisions', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { body, note, file_path } = req.body;

  const content = await queryOne<{ id: string; org_id: string; current_revision_id: string }>('SELECT * FROM content WHERE id = ?', [id]);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  const lastRev = await queryOne<{ number: number }>('SELECT max(number) as number FROM revisions WHERE content_id = ?', [id]);
  const nextNum = (lastRev?.number || 1) + 1;
  const newRevId = `REV-${Date.now()}`;
  const now = new Date().toISOString();
  const userId = req.user!.id;

  await execute(`
    INSERT INTO revisions (id, content_id, number, body, file_path, score, created_by, created_at, note)
    VALUES (?, ?, ?, ?, ?, 100, ?, ?, ?)
  `, [newRevId, id, nextNum, body, file_path || null, userId, now, note || `Revision ${nextNum}`]);

  // Update content current_revision_id & updated_at
  await execute(`
    UPDATE content SET current_revision_id = ?, updated_at = ? WHERE id = ?
  `, [newRevId, now, id]);

  // Run initial rules check on new revision
  const library = await fetchLibrary();
  const rulesFindings = runDeterministicRules(body, library);
  const score = computeBrandScore(rulesFindings);

  let fCount = 1;
  for (const f of rulesFindings) {
    const fId = `FND-${Date.now()}-${fCount++}`;
    await execute(`
      INSERT INTO findings (id, revision_id, type, severity, span_start, span_end, excerpt, explanation, source_type, source_id, source_quote, suggestion, decision, detected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [fId, newRevId, f.type, f.severity, f.span_start, f.span_end, f.excerpt, f.explanation, f.source_type, f.source_id, f.source_quote, f.suggestion, f.detected_by]);
  }

  await execute('UPDATE revisions SET score = ? WHERE id = ?', [score, newRevId]);

  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, 'revision.create', ?, ?, ?)
  `, [`LOG-${Date.now()}`, content.org_id, userId, newRevId, `Created revision ${nextNum} with score ${score}`, now]);

  const newRevision = await queryOne('SELECT * FROM revisions WHERE id = ?', [newRevId]);
  const newFindings = await query('SELECT * FROM findings WHERE revision_id = ?', [newRevId]);

  res.status(201).json({
    revision: newRevision,
    findings: newFindings,
    score
  });
});

// --- Submit Content for Review ---
router.post('/:id/submit', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { overrideReason } = req.body;

  const content = await queryOne<{ id: string; org_id: string; current_revision_id: string; title: string }>('SELECT * FROM content WHERE id = ?', [id]);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // Check for unresolved high-severity findings
  const pendingHigh = await query(`
    SELECT * FROM findings
    WHERE revision_id = ? AND severity = 'high' AND decision = 'pending'
  `, [content.current_revision_id]);

  if (pendingHigh.length > 0 && !overrideReason) {
    return res.status(400).json({
      error: `Cannot submit for review with ${pendingHigh.length} unresolved high-severity finding(s). You must either accept/edit/reject the findings or provide an explicit override justification.`,
      pendingCount: pendingHigh.length
    });
  }

  const now = new Date().toISOString();
  await execute('UPDATE content SET status = "in_review", updated_at = ? WHERE id = ?', [now, id]);

  const auditDetails = overrideReason
    ? `Submitted with ${pendingHigh.length} high-severity overrides. Justification: ${overrideReason}`
    : 'Submitted for reviewer approval';

  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, 'content.submit', ?, ?, ?)
  `, [`LOG-${Date.now()}`, content.org_id, req.user!.id, id, auditDetails, now]);

  res.json({ success: true, status: 'in_review' });
});

// --- Approvals & Changes Requested ---
router.post('/:id/approvals', authMiddleware, requireRole(['reviewer', 'manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { decision, note } = req.body;

  if (!['approved', 'changes_requested'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be either "approved" or "changes_requested"' });
  }

  const content = await queryOne<{ id: string; org_id: string; current_revision_id: string; title: string }>('SELECT * FROM content WHERE id = ?', [id]);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  const now = new Date().toISOString();
  const newStatus = decision === 'approved' ? 'approved' : 'changes_requested';

  await execute('UPDATE content SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

  const approvalId = `APP-${Date.now()}`;
  await execute(`
    INSERT INTO approvals (id, content_id, revision_id, reviewer_id, decision, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [approvalId, id, content.current_revision_id, req.user!.id, decision, note || null, now]);

  await execute(`
    INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [`LOG-${Date.now()}`, content.org_id, req.user!.id, `review.${decision}`, id, `Reviewer marked ${decision}. Note: ${note || 'None'}`, now]);

  res.json({
    success: true,
    status: newStatus,
    approval: {
      id: approvalId,
      decision,
      note,
      created_at: now
    }
  });
});

// --- Comments ---
router.post('/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { body, finding_id, revision_id } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  const content = await queryOne<{ id: string; current_revision_id: string }>('SELECT * FROM content WHERE id = ?', [id]);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  const commentId = `CMT-${Date.now()}`;
  const now = new Date().toISOString();
  const targetRevId = revision_id || content.current_revision_id;

  await execute(`
    INSERT INTO comments (id, content_id, revision_id, finding_id, user_id, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [commentId, id, targetRevId, finding_id || null, req.user!.id, body.trim(), now]);

  const createdComment = await queryOne(`
    SELECT cm.*, u.name as user_name, u.role as user_role, u.avatar_url as user_avatar
    FROM comments cm
    LEFT JOIN users u ON cm.user_id = u.id
    WHERE cm.id = ?
  `, [commentId]);

  res.status(201).json({ comment: createdComment });
});

// --- Revision History & Diff ---
router.get('/:id/history', authMiddleware, async (req, res) => {
  const { id } = req.params;

  const revisions = await query(`
    SELECT r.*, u.name as author_name, u.email as author_email, u.avatar_url as author_avatar
    FROM revisions r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.content_id = ?
    ORDER BY r.number DESC
  `, [id]);

  // Attach finding counts to each revision
  for (const rev of revisions) {
    const fCounts = await queryOne<{ total: number; resolved: number }>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN decision != 'pending' THEN 1 ELSE 0 END) as resolved
      FROM findings
      WHERE revision_id = ?
    `, [rev.id]);
    rev.findings_count = fCounts?.total || 0;
    rev.resolved_count = fCounts?.resolved || 0;
  }

  res.json({ revisions });
});

export default router;

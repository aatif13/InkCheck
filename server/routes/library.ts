import { Router } from 'express';
import { query, queryOne, execute } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

// --- Guidelines ---
router.get('/guidelines', authMiddleware, async (req, res) => {
  const guidelines = await query('SELECT * FROM guidelines ORDER BY id ASC');
  res.json({ guidelines });
});

router.post('/guidelines', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { title, category, body, severity_default, version } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM guidelines');
  const nextNum = (countRes?.c || 0) + 1;
  const id = `GD-${String(nextNum).padStart(2, '0')}`;
  const org_id = req.user?.org_id || 'org-northwind-01';

  await execute(
    'INSERT INTO guidelines (id, org_id, title, category, body, severity_default, version) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, org_id, title, category || 'messaging', body, severity_default || 'medium', version || '1.0']
  );

  await execute(
    'INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`LOG-${Date.now()}`, org_id, req.user!.id, 'guideline.create', id, `Created guideline ${title}`, new Date().toISOString()]
  );

  const created = await queryOne('SELECT * FROM guidelines WHERE id = ?', [id]);
  res.status(201).json({ guideline: created });
});

router.put('/guidelines/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, category, body, severity_default, version } = req.body;

  await execute(
    'UPDATE guidelines SET title = ?, category = ?, body = ?, severity_default = ?, version = ? WHERE id = ?',
    [title, category, body, severity_default, version, id]
  );

  await execute(
    'INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`LOG-${Date.now()}`, req.user!.org_id, req.user!.id, 'guideline.update', id, `Updated guideline ${title}`, new Date().toISOString()]
  );

  const updated = await queryOne('SELECT * FROM guidelines WHERE id = ?', [id]);
  res.json({ guideline: updated });
});

router.delete('/guidelines/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  await execute('DELETE FROM guidelines WHERE id = ?', [id]);
  res.json({ success: true });
});

// --- Facts ---
router.get('/facts', authMiddleware, async (req, res) => {
  const facts = await query('SELECT * FROM facts ORDER BY id ASC');
  res.json({ facts });
});

router.post('/facts', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { statement, status, effective_from, source_note, replaced_by } = req.body;
  if (!statement) {
    return res.status(400).json({ error: 'Statement is required' });
  }

  const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM facts');
  const nextNum = (countRes?.c || 0) + 1;
  const id = `FACT-${String(nextNum).padStart(2, '0')}`;
  const org_id = req.user?.org_id || 'org-northwind-01';

  await execute(
    'INSERT INTO facts (id, org_id, statement, status, effective_from, source_note, replaced_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, org_id, statement, status || 'approved', effective_from || new Date().toISOString().split('T')[0], source_note || null, replaced_by || null]
  );

  const created = await queryOne('SELECT * FROM facts WHERE id = ?', [id]);
  res.status(201).json({ fact: created });
});

router.put('/facts/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { statement, status, effective_from, source_note, replaced_by } = req.body;

  await execute(
    'UPDATE facts SET statement = ?, status = ?, effective_from = ?, source_note = ?, replaced_by = ? WHERE id = ?',
    [statement, status, effective_from, source_note, replaced_by, id]
  );

  const updated = await queryOne('SELECT * FROM facts WHERE id = ?', [id]);
  res.json({ fact: updated });
});

router.delete('/facts/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  await execute('DELETE FROM facts WHERE id = ?', [id]);
  res.json({ success: true });
});

// --- Terminology ---
router.get('/terms', authMiddleware, async (req, res) => {
  const terms = await query('SELECT * FROM terms ORDER BY id ASC');
  res.json({ terms });
});

router.post('/terms', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { preferred, banned_variants, reason, guideline_id } = req.body;
  if (!preferred || !reason) {
    return res.status(400).json({ error: 'Preferred term and reason are required' });
  }

  const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM terms');
  const nextNum = (countRes?.c || 0) + 1;
  const id = `TRM-${String(nextNum).padStart(2, '0')}`;
  const org_id = req.user?.org_id || 'org-northwind-01';

  const variantsStr = Array.isArray(banned_variants)
    ? JSON.stringify(banned_variants)
    : typeof banned_variants === 'string'
      ? JSON.stringify(banned_variants.split(',').map(s => s.trim()).filter(Boolean))
      : '[]';

  await execute(
    'INSERT INTO terms (id, org_id, preferred, banned_variants, reason, guideline_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, org_id, preferred, variantsStr, reason, guideline_id || 'GD-07']
  );

  const created = await queryOne('SELECT * FROM terms WHERE id = ?', [id]);
  res.status(201).json({ term: created });
});

router.put('/terms/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { preferred, banned_variants, reason, guideline_id } = req.body;

  const variantsStr = Array.isArray(banned_variants)
    ? JSON.stringify(banned_variants)
    : typeof banned_variants === 'string'
      ? JSON.stringify(banned_variants.split(',').map(s => s.trim()).filter(Boolean))
      : '[]';

  await execute(
    'UPDATE terms SET preferred = ?, banned_variants = ?, reason = ?, guideline_id = ? WHERE id = ?',
    [preferred, variantsStr, reason, guideline_id, id]
  );

  const updated = await queryOne('SELECT * FROM terms WHERE id = ?', [id]);
  res.json({ term: updated });
});

router.delete('/terms/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  await execute('DELETE FROM terms WHERE id = ?', [id]);
  res.json({ success: true });
});

// --- Assets ---
router.get('/assets', authMiddleware, async (req, res) => {
  const assets = await query('SELECT * FROM assets ORDER BY id ASC');
  res.json({ assets });
});

router.post('/assets', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { name, type, file_path, usage_rules, approved_colors } = req.body;
  if (!name || !usage_rules) {
    return res.status(400).json({ error: 'Name and usage rules are required' });
  }

  const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM assets');
  const nextNum = (countRes?.c || 0) + 1;
  const id = `AST-${String(nextNum).padStart(2, '0')}`;
  const org_id = req.user?.org_id || 'org-northwind-01';

  const colorsStr = Array.isArray(approved_colors) ? JSON.stringify(approved_colors) : '["#1D3557"]';

  await execute(
    'INSERT INTO assets (id, org_id, name, type, file_path, usage_rules, approved_colors) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, org_id, name, type || 'logo', file_path || '/assets/logo.svg', usage_rules, colorsStr]
  );

  const created = await queryOne('SELECT * FROM assets WHERE id = ?', [id]);
  res.status(201).json({ asset: created });
});

router.put('/assets/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name, type, file_path, usage_rules, approved_colors } = req.body;

  const colorsStr = Array.isArray(approved_colors) ? JSON.stringify(approved_colors) : approved_colors;

  await execute(
    'UPDATE assets SET name = ?, type = ?, file_path = ?, usage_rules = ?, approved_colors = ? WHERE id = ?',
    [name, type, file_path, usage_rules, colorsStr, id]
  );

  const updated = await queryOne('SELECT * FROM assets WHERE id = ?', [id]);
  res.json({ asset: updated });
});

router.delete('/assets/:id', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  await execute('DELETE FROM assets WHERE id = ?', [id]);
  res.json({ success: true });
});

// --- Import Guidelines from text or pasted document ---
router.post('/import', authMiddleware, requireRole(['manager']), async (req: AuthenticatedRequest, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text content is required for import' });
  }

  // Parse text into guidelines by detecting numbered sections or markdown headers
  const sections = text.split(/(?=^(?:#+\s*|\d+[\.\)]\s+|Guideline\s+\d+:?\s*))/im);
  const createdGuidelines = [];

  for (const rawSec of sections) {
    const sec = rawSec.trim();
    if (!sec || sec.length < 15) continue;

    // Extract first line as title
    const lines = sec.split('\n');
    let title = lines[0].replace(/^[#\d\.\)\s:-]+/, '').trim();
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }
    const body = lines.slice(1).join('\n').trim() || sec;

    // Detect category
    let category = 'messaging';
    const lower = sec.toLowerCase();
    if (lower.includes('tone') || lower.includes('voice')) category = 'tone';
    else if (lower.includes('legal') || lower.includes('warranty') || lower.includes('claim')) category = 'legal';
    else if (lower.includes('visual') || lower.includes('color') || lower.includes('logo')) category = 'visual';
    else if (lower.includes('access') || lower.includes('alt text') || lower.includes('contrast')) category = 'accessibility';

    const countRes = await queryOne<{ c: number }>('SELECT count(*) as c FROM guidelines');
    const nextNum = (countRes?.c || 0) + 1;
    const id = `GD-${String(nextNum).padStart(2, '0')}`;
    const org_id = req.user?.org_id || 'org-northwind-01';

    await execute(
      'INSERT INTO guidelines (id, org_id, title, category, body, severity_default, version) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, org_id, title || `Imported Guideline ${nextNum}`, category, body, 'medium', '1.0']
    );

    const created = await queryOne('SELECT * FROM guidelines WHERE id = ?', [id]);
    if (created) createdGuidelines.push(created);
  }

  res.json({
    importedCount: createdGuidelines.length,
    guidelines: createdGuidelines
  });
});

export default router;

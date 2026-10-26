import { Router } from 'express';
import { query, execute, queryOne } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { rating, comment, category } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required' });
  }

  const id = `FB-${Date.now()}`;
  const now = new Date().toISOString();
  const userId = req.user!.id;

  await execute(`
    INSERT INTO feedbacks (id, user_id, rating, comment, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, userId, Number(rating), comment.trim(), category || 'general', now]);

  res.status(201).json({ success: true, id });
});

router.get('/', authMiddleware, requireRole(['manager']), async (req, res) => {
  const feedbacks = await query(`
    SELECT f.*, u.name as user_name, u.role as user_role, u.avatar_url as user_avatar
    FROM feedbacks f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `);

  res.json({ feedbacks });
});

export default router;

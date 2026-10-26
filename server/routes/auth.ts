import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { signToken, AuthenticatedRequest, authMiddleware } from '../auth.js';

const router = Router();

router.post('/demo-login', async (req, res) => {
  const { role } = req.body;
  const targetRole = ['creator', 'manager', 'reviewer'].includes(role) ? role : 'creator';

  const user = await queryOne('SELECT * FROM users WHERE role = ? LIMIT 1', [targetRole]);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found for role' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      avatar_url: user.avatar_url
    }
  });
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

router.get('/users', authMiddleware, async (req, res) => {
  const users = await query('SELECT id, name, email, role, avatar_url FROM users');
  res.json({ users });
});

export default router;

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { queryOne } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'inkcheck-dev-secret-key-aatifmulla1113';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'manager' | 'reviewer';
  org_id: string;
  avatar_url?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      avatar_url: user.avatar_url
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // Fallback: check query or header for default demo user if unauthenticated
  const demoRole = (req.headers['x-demo-role'] as string) || 'creator';
  const fallbackUser = await queryOne<AuthUser>(
    'SELECT * FROM users WHERE role = ? LIMIT 1',
    [demoRole]
  );
  if (fallbackUser) {
    req.user = fallbackUser;
    return next();
  }

  // Fallback to first user in database
  const firstUser = await queryOne<AuthUser>('SELECT * FROM users LIMIT 1');
  if (firstUser) {
    req.user = firstUser;
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}

export function requireRole(allowedRoles: Array<'creator' | 'manager' | 'reviewer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

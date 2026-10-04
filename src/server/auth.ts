import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbStore, hashPassword, generateSalt, UserRecord } from './db';
import { UserRole, AccountStatus } from '../types/roles';

// Simple, robust server session store
interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 day expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessions.set(token, { token, userId, expiresAt });
  return token;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

export function getSessionUser(token?: string): UserRecord | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  const user = dbStore.getUserById(session.userId);
  return user || null;
}

// Extend Express Request
export interface AuthRequest extends Request {
  user?: UserRecord;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const user = getSessionUser(token);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    return;
  }

  // Check if suspended
  if (user.accountStatus === 'SUSPENDED') {
    res.status(403).json({
      error: 'Account Suspended: Your access has been restricted by administration. Contact governance@realto.ng',
    });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (token) {
    const user = getSessionUser(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden. Realto Administrator privileges required.' });
      return;
    }
    next();
  });
}

import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

const store = new Map<string, { userId: number; createdAt: number }>();

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const sessions = {
  create(userId: number): string {
    const token = randomUUID();
    store.set(token, { userId, createdAt: Date.now() });
    return token;
  },
  lookup(token: string): number | null {
    const entry = store.get(token);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > TTL_MS) {
      store.delete(token);
      return null;
    }
    return entry.userId;
  },
  destroy(token: string): void {
    store.delete(token);
  },
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  const userId = sessions.lookup(auth.slice(7));
  if (userId === null) {
    res.status(401).json({ error: "انتهت الجلسة" });
    return;
  }
  (req as typeof req & { userId: number }).userId = userId;
  next();
}

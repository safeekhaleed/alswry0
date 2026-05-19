import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { sessions, requireAuth } from "../lib/sessions.js";

const router = Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "blaksafee@gmail.com").toLowerCase();

function userPublic(u: typeof usersTable.$inferSelect, token?: string) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    balance: u.balance,
    isVip: u.isVip,
    vipLevel: u.vipLevel ?? 0,
    totalRecharged: u.totalRecharged ?? "0",
    isAdmin: u.isAdmin,
    pushToken: u.pushToken,
    accountId: u.accountId,
    ...(token ? { token } : {}),
  };
}

router.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !email || !password) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "البريد الإلكتروني مسجل مسبقاً" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const [user] = await db
    .insert(usersTable)
    .values({ username, email: email.toLowerCase(), passwordHash, isAdmin })
    .returning();
  const token = sessions.create(user.id);
  res.status(201).json(userPublic(user, token));
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  const token = sessions.create(user.id);
  res.json(userPublic(user, token));
});

router.post("/auth/admin-login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "لا تملك صلاحيات الأدمن" });
    return;
  }
  const token = sessions.create(user.id);
  res.json(userPublic(user, token));
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  res.json(userPublic(user));
});

router.post("/auth/logout", (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    sessions.destroy(auth.slice(7));
  }
  res.json({ ok: true });
});

export default router;

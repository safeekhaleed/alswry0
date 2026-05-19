import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

function userPublic(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

router.patch("/auth/user/profile", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { username, avatarUrl } = req.body ?? {};
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username !== undefined) updates.username = String(username).trim();
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا يوجد شيء للتحديث" });
    return;
  }
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  res.json(userPublic(updated));
});

router.patch("/auth/user/password", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" }); return; }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

router.patch("/auth/user/email", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { newEmail, password } = req.body ?? {};
  if (!newEmail) { res.status(400).json({ error: "البريد الإلكتروني الجديد مطلوب" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  if (password) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "كلمة المرور غير صحيحة" }); return; }
  }
  const existing = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, newEmail.toLowerCase())).limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "هذا البريد مستخدم بالفعل" }); return; }
  const [updated] = await db.update(usersTable).set({ email: newEmail.toLowerCase() })
    .where(eq(usersTable.id, userId)).returning();
  res.json(userPublic(updated!));
});

router.delete("/auth/user/account", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { password } = req.body ?? {};
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  if (password) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "كلمة المرور غير صحيحة" }); return; }
  }
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

export default router;

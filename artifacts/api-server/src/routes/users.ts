import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

function safe(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

router.get("/users", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(safe));
});

router.get("/users/:id", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, Number(req.params.id)))
    .limit(1);
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  res.json(safe(user));
});

router.patch("/users/:id", requireAuth, async (req, res) => {
  const { username, balance, isVip, isAdmin, pushToken, accountId, password } = req.body ?? {};
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username !== undefined) updates.username = username;
  if (balance !== undefined) updates.balance = String(balance);
  if (isVip !== undefined) updates.isVip = isVip;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (pushToken !== undefined) updates.pushToken = pushToken;
  if (accountId !== undefined) updates.accountId = accountId;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);
  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, Number(req.params.id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  res.json(safe(updated));
});

router.delete("/users/:id", requireAuth, async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

import { Router } from "express";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, notificationsTable, sentNotificationsLogTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const items = await db
    .select()
    .from(notificationsTable)
    .where(or(eq(notificationsTable.userId, userId), isNull(notificationsTable.userId)))
    .orderBy(notificationsTable.sentAt);
  res.json(items);
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const items = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .where(and(
      or(eq(notificationsTable.userId, userId), isNull(notificationsTable.userId)),
      eq(notificationsTable.isRead, false),
    ));
  res.json({ count: items.length });
});

router.post("/notifications/mark-read/:id", requireAuth, async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.post("/notifications/mark-all-read", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(or(eq(notificationsTable.userId, userId), isNull(notificationsTable.userId)));
  res.json({ ok: true });
});

router.post("/notifications/send", requireAuth, async (req, res) => {
  const { title, message, type, targetUserId } = req.body ?? {};
  if (!title) { res.status(400).json({ error: "العنوان مطلوب" }); return; }
  if (targetUserId) {
    const [notif] = await db.insert(notificationsTable).values({
      userId: targetUserId, title, message, type: type ?? "info",
    }).returning();
    res.status(201).json(notif);
    return;
  }
  const users = await db.select({ id: usersTable.id }).from(usersTable);
  const values = users.map((u) => ({ userId: u.id, title, message, type: type ?? "info" }));
  if (values.length > 0) await db.insert(notificationsTable).values(values);
  await db.insert(sentNotificationsLogTable).values({
    title, message, type: type ?? "info", recipientCount: users.length,
  });
  res.status(201).json({ sent: users.length });
});

router.get("/notifications/log", requireAuth, async (_req, res) => {
  const log = await db
    .select()
    .from(sentNotificationsLogTable)
    .orderBy(sentNotificationsLogTable.sentAt);
  res.json(log);
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  await db.delete(notificationsTable).where(eq(notificationsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

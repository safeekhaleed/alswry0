import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/banners", async (_req, res) => {
  const banners = await db
    .select()
    .from(bannersTable)
    .where(eq(bannersTable.isActive, true))
    .orderBy(bannersTable.sortOrder);
  res.json(banners);
});

router.get("/banners/all", requireAuth, async (_req, res) => {
  const banners = await db.select().from(bannersTable).orderBy(bannersTable.sortOrder);
  res.json(banners);
});

router.post("/banners", requireAuth, async (req, res) => {
  const { imageUrl, title, linkUrl, sortOrder, isActive } = req.body ?? {};
  if (!imageUrl) { res.status(400).json({ error: "رابط الصورة مطلوب" }); return; }
  const [banner] = await db.insert(bannersTable).values({
    imageUrl, title, linkUrl, sortOrder: sortOrder ?? 0, isActive: isActive ?? true,
  }).returning();
  res.status(201).json(banner);
});

router.patch("/banners/:id", requireAuth, async (req, res) => {
  const { imageUrl, title, linkUrl, sortOrder, isActive } = req.body ?? {};
  const updates: Partial<typeof bannersTable.$inferInsert> = {};
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (title !== undefined) updates.title = title;
  if (linkUrl !== undefined) updates.linkUrl = linkUrl;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(bannersTable).set(updates)
    .where(eq(bannersTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "البانر غير موجود" }); return; }
  res.json(updated);
});

router.delete("/banners/:id", requireAuth, async (req, res) => {
  await db.delete(bannersTable).where(eq(bannersTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

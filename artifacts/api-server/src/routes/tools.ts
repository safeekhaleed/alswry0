import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, toolsTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/tools", async (_req, res) => {
  const tools = await db.select().from(toolsTable).orderBy(toolsTable.createdAt);
  res.json(tools);
});

router.get("/tools/:id", async (req, res) => {
  const [tool] = await db
    .select()
    .from(toolsTable)
    .where(eq(toolsTable.id, Number(req.params.id)))
    .limit(1);
  if (!tool) { res.status(404).json({ error: "الأداة غير موجودة" }); return; }
  res.json(tool);
});

router.post("/tools", requireAuth, async (req, res) => {
  const { title, description, category, color, url, iconUrl, imageUrl, content, contentType, isActive } = req.body ?? {};
  if (!title) { res.status(400).json({ error: "العنوان مطلوب" }); return; }
  const [tool] = await db.insert(toolsTable).values({
    title, description, category, color, url, iconUrl, imageUrl, content, contentType,
    isActive: isActive ?? true,
  }).returning();
  res.status(201).json(tool);
});

router.patch("/tools/:id", requireAuth, async (req, res) => {
  const { title, description, category, color, url, iconUrl, imageUrl, content, contentType, isActive } = req.body ?? {};
  const updates: Partial<typeof toolsTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (color !== undefined) updates.color = color;
  if (url !== undefined) updates.url = url;
  if (iconUrl !== undefined) updates.iconUrl = iconUrl;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (content !== undefined) updates.content = content;
  if (contentType !== undefined) updates.contentType = contentType;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(toolsTable).set(updates)
    .where(eq(toolsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "الأداة غير موجودة" }); return; }
  res.json(updated);
});

router.delete("/tools/:id", requireAuth, async (req, res) => {
  await db.delete(toolsTable).where(eq(toolsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

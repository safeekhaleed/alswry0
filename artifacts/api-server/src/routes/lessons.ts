import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, lessonsTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/lessons", async (_req, res) => {
  const lessons = await db.select().from(lessonsTable).orderBy(lessonsTable.createdAt);
  res.json(lessons);
});

router.get("/lessons/:id", async (req, res) => {
  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, Number(req.params.id)))
    .limit(1);
  if (!lesson) { res.status(404).json({ error: "الدرس غير موجود" }); return; }
  res.json(lesson);
});

router.post("/lessons", requireAuth, async (req, res) => {
  const { title, description, category, duration, videoUrl, imageUrl, content, contentType, isPublished } = req.body ?? {};
  if (!title) { res.status(400).json({ error: "العنوان مطلوب" }); return; }
  const [lesson] = await db.insert(lessonsTable).values({
    title, description, category, duration: duration ?? 0, videoUrl, imageUrl,
    content, contentType, isPublished: isPublished ?? false,
  }).returning();
  res.status(201).json(lesson);
});

router.patch("/lessons/:id", requireAuth, async (req, res) => {
  const { title, description, category, duration, videoUrl, imageUrl, content, contentType, isPublished } = req.body ?? {};
  const updates: Partial<typeof lessonsTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (duration !== undefined) updates.duration = duration;
  if (videoUrl !== undefined) updates.videoUrl = videoUrl;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (content !== undefined) updates.content = content;
  if (contentType !== undefined) updates.contentType = contentType;
  if (isPublished !== undefined) updates.isPublished = isPublished;
  const [updated] = await db.update(lessonsTable).set(updates)
    .where(eq(lessonsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "الدرس غير موجود" }); return; }
  res.json(updated);
});

router.delete("/lessons/:id", requireAuth, async (req, res) => {
  await db.delete(lessonsTable).where(eq(lessonsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

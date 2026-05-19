import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/services", async (_req, res) => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.createdAt);
  res.json(services);
});

router.get("/services/:id", async (req, res) => {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, Number(req.params.id)))
    .limit(1);
  if (!service) { res.status(404).json({ error: "الخدمة غير موجودة" }); return; }
  res.json(service);
});

router.post("/services", requireAuth, async (req, res) => {
  const { title, description, category, price, url, iconUrl, imageUrl, content, contentType, isAvailable } = req.body ?? {};
  if (!title) { res.status(400).json({ error: "العنوان مطلوب" }); return; }
  const [service] = await db.insert(servicesTable).values({
    title, description, category, price: price ?? "0", url, iconUrl,
    imageUrl, content, contentType, isAvailable: isAvailable ?? true,
  }).returning();
  res.status(201).json(service);
});

router.patch("/services/:id", requireAuth, async (req, res) => {
  const { title, description, category, price, url, iconUrl, imageUrl, content, contentType, isAvailable } = req.body ?? {};
  const updates: Partial<typeof servicesTable.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (price !== undefined) updates.price = String(price);
  if (url !== undefined) updates.url = url;
  if (iconUrl !== undefined) updates.iconUrl = iconUrl;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (content !== undefined) updates.content = content;
  if (contentType !== undefined) updates.contentType = contentType;
  if (isAvailable !== undefined) updates.isAvailable = isAvailable;
  const [updated] = await db.update(servicesTable).set(updates)
    .where(eq(servicesTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "الخدمة غير موجودة" }); return; }
  res.json(updated);
});

router.delete("/services/:id", requireAuth, async (req, res) => {
  await db.delete(servicesTable).where(eq(servicesTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

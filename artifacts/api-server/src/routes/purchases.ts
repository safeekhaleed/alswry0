import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, servicesTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/purchases", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const enriched = await Promise.all(
    orders.map(async (order) => {
      let content: string | null = null;
      let contentType: string | null = null;
      let imageUrl: string | null = null;

      if (order.itemType === "service") {
        const [svc] = await db
          .select()
          .from(servicesTable)
          .where(eq(servicesTable.id, order.itemId))
          .limit(1);
        if (svc) {
          content = svc.content ?? null;
          contentType = svc.contentType ?? null;
          imageUrl = svc.imageUrl ?? null;
        }
      }

      return { ...order, content, contentType, imageUrl };
    })
  );

  res.json(enriched);
});

export default router;

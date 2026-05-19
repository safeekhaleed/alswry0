import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, rechargeRequestsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.get("/recharge", requireAuth, async (_req, res) => {
  const requests = await db
    .select()
    .from(rechargeRequestsTable)
    .orderBy(rechargeRequestsTable.createdAt);
  res.json(requests);
});

router.post("/recharge", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { paymentMethod, transactionId, transferImageUrl, amount } = req.body ?? {};
  if (!paymentMethod || !transactionId) {
    res.status(400).json({ error: "طريقة الدفع ورقم العملية مطلوبان" });
    return;
  }
  const [user] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const [request] = await db
    .insert(rechargeRequestsTable)
    .values({
      userId,
      username: user?.username ?? "unknown",
      paymentMethod,
      transactionId,
      transferImageUrl,
      amount: amount ? String(amount) : null,
    })
    .returning();
  res.status(201).json(request);
});

router.patch("/recharge/:id", requireAuth, async (req, res) => {
  const { status, amount } = req.body ?? {};
  const updates: Partial<typeof rechargeRequestsTable.$inferInsert> = {};
  if (status !== undefined) updates.status = status;
  if (amount !== undefined) updates.amount = String(amount);
  const [updated] = await db
    .update(rechargeRequestsTable)
    .set(updates)
    .where(eq(rechargeRequestsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  if (status === "approved" && updated.amount) {
    const [user] = await db
      .select({ balance: usersTable.balance })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId))
      .limit(1);
    if (user) {
      const newBalance = parseFloat(user.balance ?? "0") + parseFloat(updated.amount);
      await db
        .update(usersTable)
        .set({ balance: String(newBalance) })
        .where(eq(usersTable.id, updated.userId));
    }
  }
  res.json(updated);
});

router.delete("/recharge/:id", requireAuth, async (req, res) => {
  await db
    .delete(rechargeRequestsTable)
    .where(eq(rechargeRequestsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;

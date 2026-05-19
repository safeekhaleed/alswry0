import { Router } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  toolsTable,
  lessonsTable,
  servicesTable,
  rechargeRequestsTable,
} from "@workspace/db";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [
    users,
    vipUsers,
    tools,
    lessons,
    services,
    pendingRecharge,
  ] = await Promise.all([
    db.select({ id: usersTable.id }).from(usersTable),
    db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isVip, true)),
    db.select({ id: toolsTable.id }).from(toolsTable).where(eq(toolsTable.isActive, true)),
    db.select({ id: lessonsTable.id }).from(lessonsTable).where(eq(lessonsTable.isPublished, true)),
    db.select({ id: servicesTable.id }).from(servicesTable).where(eq(servicesTable.isAvailable, true)),
    db.select({ id: rechargeRequestsTable.id }).from(rechargeRequestsTable).where(eq(rechargeRequestsTable.status, "pending")),
  ]);
  res.json({
    totalUsers: users.length,
    vipUsers: vipUsers.length,
    activeTools: tools.length,
    publishedLessons: lessons.length,
    availableServices: services.length,
    pendingRecharge: pendingRecharge.length,
  });
});

export default router;

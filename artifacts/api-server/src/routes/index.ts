import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import toolsRouter from "./tools.js";
import lessonsRouter from "./lessons.js";
import servicesRouter from "./services.js";
import notificationsRouter from "./notifications.js";
import bannersRouter from "./banners.js";
import rechargeRouter from "./recharge.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(toolsRouter);
router.use(lessonsRouter);
router.use(servicesRouter);
router.use(notificationsRouter);
router.use(bannersRouter);
router.use(rechargeRouter);
router.use(statsRouter);

export default router;

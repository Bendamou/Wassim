import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import professionalsRouter from "./professionals";
import jobsRouter from "./jobs";
import bidsRouter from "./bids";
import dashboardRouter from "./dashboard";
import salonsRouter from "./salons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(professionalsRouter);
router.use(jobsRouter);
router.use(bidsRouter);
router.use(dashboardRouter);
router.use(salonsRouter);

export default router;

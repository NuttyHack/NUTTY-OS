import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nuttyRouter from "./nutty";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nuttyRouter);
router.use("/ai", aiRouter);

export default router;
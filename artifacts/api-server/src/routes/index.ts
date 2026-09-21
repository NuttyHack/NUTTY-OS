import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nuttyRouter from "./nutty";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nuttyRouter);

export default router;

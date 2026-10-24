import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import careerRouter from "./career";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(careerRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import careerRouter from "./career";
import plansRouter from './plans';
import matchesRouter from './matches';
import voiceRouter from './voice';
import agenticLlmRouter from './agentic-llm';
import { requestLimit } from '../middlewares/requestLimits';

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
const aiLimit = requestLimit(30, 60000);
router.use('/career', (req, res, next) => {
  if (req.method === 'POST') { aiLimit(req, res, next); return; }
  next();
});
router.use(careerRouter);
router.use(plansRouter);
router.use(matchesRouter);
router.use(voiceRouter);
router.use(agenticLlmRouter);

export default router;

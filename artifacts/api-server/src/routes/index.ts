import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import incomeRouter from "./income";
import expensesRouter from "./expenses";
import obligationsRouter from "./obligations";
import savingsRouter from "./savings";
import scoresRouter from "./scores";
import loansRouter from "./loans";
import advisoryRouter from "./advisory";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import timelineRouter from "./timeline";
import askAiRouter from "./ask-ai";
import financialProductsRouter from "./financial-products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(incomeRouter);
router.use(expensesRouter);
router.use(obligationsRouter);
router.use(savingsRouter);
router.use(scoresRouter);
router.use(loansRouter);
router.use(advisoryRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(timelineRouter);
router.use(askAiRouter);
router.use(financialProductsRouter);

export default router;

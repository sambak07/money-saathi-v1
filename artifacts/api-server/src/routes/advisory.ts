import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, calculateScore, generateAdvisory } from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/advisory", requireAuth, async (req, res): Promise<void> => {
  const summary = await getFinancialSummary(req.userId!);
  const score = calculateScore(summary);
  const recommendations = generateAdvisory(summary, score);

  res.json({
    recommendations,
    topRecommendation: recommendations[0],
  });
});

export default router;

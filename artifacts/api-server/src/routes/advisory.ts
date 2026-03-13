import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  getFinancialSummary, getProfileType,
  calculateScore, generateAdvisory,
  calculateBusinessScore, generateBusinessAdvisory,
} from "../lib/financialEngine";
import { generateProductRecommendations } from "../lib/recommendationEngine";

const router: IRouter = Router();

router.get("/advisory", requireAuth, async (req, res): Promise<void> => {
  const profileType = await getProfileType(req.userId!);
  const summary = await getFinancialSummary(req.userId!);
  const isBusiness = profileType === "small_business";

  let recommendations: any;
  let scoreForRec: any;
  let businessScoreForRec: any;

  if (isBusiness) {
    const bScore = calculateBusinessScore(summary);
    recommendations = generateBusinessAdvisory(summary, bScore);
    businessScoreForRec = bScore;
  } else {
    const score = calculateScore(summary);
    recommendations = generateAdvisory(summary, score);
    scoreForRec = score;
  }

  const bestNextOptions = await generateProductRecommendations(
    summary,
    profileType,
    scoreForRec,
    businessScoreForRec,
  ).catch(() => ({ recommendations: [], cautionMessage: null }));

  res.json({
    recommendations,
    topRecommendation: recommendations[0],
    bestNextOptions,
  });
});

export default router;

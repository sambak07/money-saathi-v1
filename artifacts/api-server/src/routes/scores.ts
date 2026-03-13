import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, financialScoresTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  getFinancialSummary, getProfileType,
  calculateScore, calculateBusinessScore,
} from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/scores", requireAuth, async (req, res): Promise<void> => {
  const [score] = await db
    .select()
    .from(financialScoresTable)
    .where(eq(financialScoresTable.userId, req.userId!))
    .orderBy(desc(financialScoresTable.calculatedAt))
    .limit(1);

  if (!score) {
    res.status(404).json({ message: "No score calculated yet" });
    return;
  }

  const profileType = await getProfileType(req.userId!);
  if (profileType === "small_business") {
    const summary = await getFinancialSummary(req.userId!);
    const bScore = calculateBusinessScore(summary);
    res.json({
      ...score,
      ...bScore,
      savingsRatio: bScore.profitMargin,
      savingsScore: bScore.profitScore,
      emergencyFundCoverage: bScore.cashReserveMonths,
      emergencyScore: bScore.cashReserveScore,
      expenseRatio: bScore.revenueStabilityRatio,
      expenseScore: bScore.revenueStabilityScore,
    });
    return;
  }

  res.json(score);
});

router.post("/scores/calculate", requireAuth, async (req, res): Promise<void> => {
  const profileType = await getProfileType(req.userId!);
  const summary = await getFinancialSummary(req.userId!);

  let scoreData: any;
  if (profileType === "small_business") {
    const bScore = calculateBusinessScore(summary);
    scoreData = {
      totalScore: bScore.totalScore,
      category: bScore.category,
      savingsRatio: bScore.profitMargin,
      debtRatio: bScore.debtRatio,
      emergencyFundCoverage: bScore.cashReserveMonths,
      expenseRatio: bScore.revenueStabilityRatio,
      savingsScore: bScore.profitScore,
      debtScore: bScore.debtScore,
      emergencyScore: bScore.cashReserveScore,
      expenseScore: bScore.revenueStabilityScore,
    };
  } else {
    scoreData = calculateScore(summary);
  }

  const [saved] = await db
    .insert(financialScoresTable)
    .values({ userId: req.userId!, ...scoreData })
    .returning();

  res.json(saved);
});

export default router;

import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, financialScoresTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  getFinancialSummary, getProfileType,
  calculateScore, generateAdvisory, generateVerdict,
  calculateBusinessScore, generateBusinessAdvisory, generateBusinessVerdict,
} from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const profileType = await getProfileType(req.userId!);
  const summary = await getFinancialSummary(req.userId!);

  const isBusiness = profileType === "small_business";

  let scoreData: any;
  let advisory: any;
  let verdict: any;

  if (isBusiness) {
    const bScore = calculateBusinessScore(summary);
    advisory = generateBusinessAdvisory(summary, bScore);
    verdict = generateBusinessVerdict(summary, bScore);
    scoreData = {
      totalScore: bScore.totalScore,
      category: bScore.category,
      profitMargin: bScore.profitMargin,
      debtRatio: bScore.debtRatio,
      cashReserveMonths: bScore.cashReserveMonths,
      revenueStabilityRatio: bScore.revenueStabilityRatio,
      profitScore: bScore.profitScore,
      debtScore: bScore.debtScore,
      cashReserveScore: bScore.cashReserveScore,
      revenueStabilityScore: bScore.revenueStabilityScore,
      savingsRatio: 0,
      emergencyFundCoverage: 0,
      expenseRatio: 0,
      savingsScore: 0,
      emergencyScore: 0,
      expenseScore: 0,
    };
  } else {
    scoreData = calculateScore(summary);
    advisory = generateAdvisory(summary, scoreData);
    verdict = generateVerdict(summary, scoreData);
  }

  const [existingScore] = await db
    .select()
    .from(financialScoresTable)
    .where(eq(financialScoresTable.userId, req.userId!))
    .orderBy(desc(financialScoresTable.calculatedAt))
    .limit(1);

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("default", { month: "short" }),
      income: i === 0 ? Math.round(summary.totalMonthlyIncome) : 0,
      expenses: i === 0 ? Math.round(summary.totalMonthlyExpenses) : 0,
    });
  }

  const financialScore = {
    id: existingScore?.id || 0,
    userId: req.userId!,
    ...scoreData,
    calculatedAt: existingScore?.calculatedAt || new Date(),
  };

  const netValue = isBusiness
    ? Math.round((summary.totalMonthlyIncome - summary.totalMonthlyExpenses - summary.totalMonthlyObligations) * 100) / 100
    : Math.round((summary.totalMonthlyIncome - summary.totalMonthlyExpenses - summary.totalMonthlyObligations) * 100) / 100;

  res.json({
    profileType,
    financialScore,
    verdict,
    totalIncome: Math.round(summary.totalMonthlyIncome * 100) / 100,
    totalExpenses: Math.round(summary.totalMonthlyExpenses * 100) / 100,
    netSavings: netValue,
    totalObligations: Math.round(summary.totalMonthlyObligations * 100) / 100,
    totalSavingsBalance: Math.round(summary.totalSavingsBalance * 100) / 100,
    topRecommendation: advisory[0],
    incomeVsExpenses: months,
    dataPresence: {
      hasIncome: summary.totalMonthlyIncome > 0,
      hasExpenses: summary.totalMonthlyExpenses > 0,
      hasObligations: summary.totalMonthlyObligations > 0,
      hasSavings: summary.totalSavingsBalance > 0,
    },
  });
});

export default router;

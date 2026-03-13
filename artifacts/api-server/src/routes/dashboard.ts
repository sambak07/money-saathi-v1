import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, financialScoresTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, calculateScore, generateAdvisory, generateVerdict } from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const summary = await getFinancialSummary(req.userId!);
  const scoreData = calculateScore(summary);
  const advisory = generateAdvisory(summary, scoreData);
  const verdict = generateVerdict(summary, scoreData);

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

  res.json({
    financialScore,
    verdict,
    totalIncome: Math.round(summary.totalMonthlyIncome * 100) / 100,
    totalExpenses: Math.round(summary.totalMonthlyExpenses * 100) / 100,
    netSavings: Math.round((summary.totalMonthlyIncome - summary.totalMonthlyExpenses - summary.totalMonthlyObligations) * 100) / 100,
    totalObligations: Math.round(summary.totalMonthlyObligations * 100) / 100,
    totalSavingsBalance: Math.round(summary.totalSavingsBalance * 100) / 100,
    topRecommendation: advisory[0],
    incomeVsExpenses: months,
  });
});

export default router;

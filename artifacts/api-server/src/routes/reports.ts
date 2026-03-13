import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, calculateScore, generateAdvisory } from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/reports", requireAuth, async (req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, req.userId!))
    .orderBy(desc(reportsTable.year), desc(reportsTable.month));
  res.json(reports);
});

router.post("/reports/generate", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [existing] = await db
    .select()
    .from(reportsTable)
    .where(and(
      eq(reportsTable.userId, req.userId!),
      eq(reportsTable.month, month),
      eq(reportsTable.year, year),
    ));

  if (existing) {
    res.json(existing);
    return;
  }

  const summary = await getFinancialSummary(req.userId!);
  const score = calculateScore(summary);
  const advisory = generateAdvisory(summary, score);

  const [report] = await db.insert(reportsTable).values({
    userId: req.userId!,
    month,
    year,
    totalIncome: Math.round(summary.totalMonthlyIncome * 100) / 100,
    totalExpenses: Math.round(summary.totalMonthlyExpenses * 100) / 100,
    totalSavings: Math.round(summary.totalSavingsBalance * 100) / 100,
    totalDebt: Math.round(summary.totalMonthlyObligations * 100) / 100,
    netSavings: Math.round((summary.totalMonthlyIncome - summary.totalMonthlyExpenses - summary.totalMonthlyObligations) * 100) / 100,
    financialScore: score.totalScore,
    scoreCategory: score.category,
    recommendations: advisory.map(a => `${a.title}: ${a.description}`),
  }).returning();

  res.json(report);
});

export default router;

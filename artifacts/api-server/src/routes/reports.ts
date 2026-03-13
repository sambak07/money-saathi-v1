import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  getFinancialSummary, getProfileType,
  calculateScore, generateAdvisory, generateVerdictFromReport,
  calculateBusinessScore, generateBusinessAdvisory,
} from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/reports", requireAuth, async (req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, req.userId!))
    .orderBy(desc(reportsTable.year), desc(reportsTable.month));

  const enriched = reports.map(r => ({
    ...r,
    verdict: generateVerdictFromReport(r),
  }));

  res.json(enriched);
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
    res.json({ ...existing, verdict: generateVerdictFromReport(existing) });
    return;
  }

  const profileType = await getProfileType(req.userId!);
  const summary = await getFinancialSummary(req.userId!);
  const isBusiness = profileType === "small_business";
  const score = isBusiness ? calculateBusinessScore(summary) : calculateScore(summary);
  const advisory = isBusiness ? generateBusinessAdvisory(summary, score as any) : generateAdvisory(summary, score as any);

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

  res.json({ ...report, verdict: generateVerdictFromReport(report) });
});

export default router;

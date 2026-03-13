import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, loanCalculationsTable } from "@workspace/db";
import { CalculateLoanBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, calculateScore } from "../lib/financialEngine";

const router: IRouter = Router();

router.post("/loans/calculate", requireAuth, async (req, res): Promise<void> => {
  const parsed = CalculateLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { loanAmount, interestRate, tenureMonths } = parsed.data;

  const monthlyRate = interestRate / 100 / 12;
  let emi: number;
  if (monthlyRate === 0) {
    emi = loanAmount / tenureMonths;
  } else {
    emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - loanAmount;

  const summary = await getFinancialSummary(req.userId!);
  const income = summary.totalMonthlyIncome || 1;

  const safeEmiMin = income * 0.2;
  const safeEmiMax = income * 0.4;

  let affordabilityStatus: string;
  if (emi <= safeEmiMin) affordabilityStatus = "affordable";
  else if (emi <= safeEmiMax) affordabilityStatus = "stretching";
  else affordabilityStatus = "unaffordable";

  const currentScore = calculateScore(summary);
  const newObligations = summary.totalMonthlyObligations + emi;
  const newSummary = { ...summary, totalMonthlyObligations: newObligations };
  const newScore = calculateScore(newSummary);
  const healthScoreImpact = newScore.totalScore - currentScore.totalScore;

  const [saved] = await db.insert(loanCalculationsTable).values({
    userId: req.userId!,
    loanAmount,
    interestRate,
    tenureMonths,
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    safeEmiMin: Math.round(safeEmiMin * 100) / 100,
    safeEmiMax: Math.round(safeEmiMax * 100) / 100,
    affordabilityStatus,
    healthScoreImpact,
  }).returning();

  res.json(saved);
});

router.get("/loans", requireAuth, async (req, res): Promise<void> => {
  const calculations = await db
    .select()
    .from(loanCalculationsTable)
    .where(eq(loanCalculationsTable.userId, req.userId!))
    .orderBy(desc(loanCalculationsTable.createdAt));
  res.json(calculations);
});

export default router;

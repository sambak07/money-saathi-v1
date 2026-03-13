import { db, incomeEntriesTable, expenseEntriesTable, obligationsTable, savingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly": return amount * 4.33;
    case "yearly": return amount / 12;
    case "one_time": return amount / 12;
    default: return amount;
  }
}

export interface ScoreBreakdown {
  totalScore: number;
  category: string;
  savingsRatio: number;
  debtRatio: number;
  emergencyFundCoverage: number;
  expenseRatio: number;
  savingsScore: number;
  debtScore: number;
  emergencyScore: number;
  expenseScore: number;
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlyObligations: number;
  totalSavingsBalance: number;
  emergencyFundBalance: number;
}

export async function getFinancialSummary(userId: number): Promise<FinancialSummary> {
  const incomes = await db.select().from(incomeEntriesTable).where(eq(incomeEntriesTable.userId, userId));
  const expenses = await db.select().from(expenseEntriesTable).where(eq(expenseEntriesTable.userId, userId));
  const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
  const savings = await db.select().from(savingsTable).where(eq(savingsTable.userId, userId));

  const totalMonthlyIncome = incomes.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);
  const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);
  const totalMonthlyObligations = obligations.reduce((sum, o) => sum + o.monthlyPayment, 0);
  const totalSavingsBalance = savings.reduce((sum, s) => sum + s.amount, 0);
  const emergencyFundBalance = savings
    .filter(s => s.savingsType === "emergency_fund")
    .reduce((sum, s) => sum + s.amount, 0);

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyObligations,
    totalSavingsBalance,
    emergencyFundBalance,
  };
}

export function calculateScore(summary: FinancialSummary): ScoreBreakdown {
  const { totalMonthlyIncome, totalMonthlyExpenses, totalMonthlyObligations, totalSavingsBalance, emergencyFundBalance } = summary;

  const income = totalMonthlyIncome || 1;

  const savingsRatio = totalSavingsBalance / (income * 12);
  const debtRatio = totalMonthlyObligations / income;
  const emergencyFundCoverage = emergencyFundBalance / (totalMonthlyExpenses || 1);
  const expenseRatio = totalMonthlyExpenses / income;

  let savingsScore = Math.min(25, savingsRatio * 50);
  if (savingsRatio >= 0.5) savingsScore = 25;

  let debtScore = 25;
  if (debtRatio > 0.5) debtScore = 5;
  else if (debtRatio > 0.4) debtScore = 10;
  else if (debtRatio > 0.3) debtScore = 15;
  else if (debtRatio > 0.2) debtScore = 20;

  let emergencyScore = Math.min(25, emergencyFundCoverage * 4.17);
  if (emergencyFundCoverage >= 6) emergencyScore = 25;

  let expenseScore = 25;
  if (expenseRatio > 0.9) expenseScore = 5;
  else if (expenseRatio > 0.8) expenseScore = 10;
  else if (expenseRatio > 0.7) expenseScore = 15;
  else if (expenseRatio > 0.5) expenseScore = 20;

  const totalScore = Math.round(Math.min(100, Math.max(0, savingsScore + debtScore + emergencyScore + expenseScore)));

  let category: string;
  if (totalScore >= 80) category = "Excellent";
  else if (totalScore >= 65) category = "Strong";
  else if (totalScore >= 45) category = "Moderate";
  else if (totalScore >= 25) category = "Risk";
  else category = "Critical";

  return {
    totalScore,
    category,
    savingsRatio: Math.round(savingsRatio * 1000) / 1000,
    debtRatio: Math.round(debtRatio * 1000) / 1000,
    emergencyFundCoverage: Math.round(emergencyFundCoverage * 100) / 100,
    expenseRatio: Math.round(expenseRatio * 1000) / 1000,
    savingsScore: Math.round(savingsScore * 10) / 10,
    debtScore: Math.round(debtScore * 10) / 10,
    emergencyScore: Math.round(emergencyScore * 10) / 10,
    expenseScore: Math.round(expenseScore * 10) / 10,
  };
}

export interface AdvisoryItem {
  category: string;
  title: string;
  description: string;
  priority: string;
  currentValue: number | null;
  targetValue: number | null;
}

export function generateAdvisory(summary: FinancialSummary, score: ScoreBreakdown): AdvisoryItem[] {
  const recommendations: AdvisoryItem[] = [];
  const income = summary.totalMonthlyIncome || 1;

  if (score.savingsScore < 20) {
    recommendations.push({
      category: "savings",
      title: "Increase Your Savings",
      description: `Your savings are ${Math.round(score.savingsRatio * 100)}% of annual income. Aim for at least 50% for a strong financial foundation.`,
      priority: score.savingsScore < 10 ? "high" : "medium",
      currentValue: Math.round(score.savingsRatio * 100),
      targetValue: 50,
    });
  }

  if (score.debtScore < 20) {
    recommendations.push({
      category: "debt",
      title: "Reduce Debt Burden",
      description: `Your monthly debt payments are ${Math.round(score.debtRatio * 100)}% of income. Keep it below 30% for healthy finances.`,
      priority: score.debtScore < 15 ? "high" : "medium",
      currentValue: Math.round(score.debtRatio * 100),
      targetValue: 30,
    });
  }

  if (score.emergencyScore < 20) {
    recommendations.push({
      category: "emergency_fund",
      title: "Build Emergency Fund",
      description: `Your emergency fund covers ${score.emergencyFundCoverage.toFixed(1)} months of expenses. Aim for at least 6 months.`,
      priority: score.emergencyFundCoverage < 3 ? "high" : "medium",
      currentValue: Math.round(score.emergencyFundCoverage * 10) / 10,
      targetValue: 6,
    });
  }

  if (score.expenseScore < 20) {
    recommendations.push({
      category: "expenses",
      title: "Control Expenses",
      description: `Your expenses consume ${Math.round(score.expenseRatio * 100)}% of income. Try to keep it below 70%.`,
      priority: score.expenseScore < 15 ? "high" : "medium",
      currentValue: Math.round(score.expenseRatio * 100),
      targetValue: 70,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: "savings",
      title: "Great Financial Health!",
      description: "Your finances are in excellent shape. Continue maintaining your current habits.",
      priority: "low",
      currentValue: score.totalScore,
      targetValue: 100,
    });
  }

  recommendations.sort((a, b) => {
    const p: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  });

  return recommendations;
}

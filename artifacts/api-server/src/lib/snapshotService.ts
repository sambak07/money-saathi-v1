import { db, financialSnapshotsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  getFinancialSummary, getProfileType,
  calculateScore, calculateBusinessScore,
} from "./financialEngine";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function updateMonthlySnapshot(userId: number): Promise<void> {
  try {
    const month = getCurrentMonth();
    const summary = await getFinancialSummary(userId);
    const profileType = await getProfileType(userId);

    let totalScore = 0;
    let debtRatio = 0;
    let emergencyFundMonths = 0;
    let profitMargin = 0;

    if (profileType === "small_business") {
      const bScore = calculateBusinessScore(summary);
      totalScore = bScore.totalScore;
      debtRatio = bScore.debtRatio;
      emergencyFundMonths = bScore.cashReserveMonths;
      profitMargin = bScore.profitMargin;
    } else {
      const score = calculateScore(summary);
      totalScore = score.totalScore;
      debtRatio = score.debtRatio;
      emergencyFundMonths = score.emergencyFundCoverage;
      profitMargin = summary.totalMonthlyIncome > 0
        ? (summary.totalMonthlyIncome - summary.totalMonthlyExpenses) / summary.totalMonthlyIncome
        : 0;
    }

    const income = Math.round(summary.totalMonthlyIncome * 100) / 100;
    const expenses = Math.round(summary.totalMonthlyExpenses * 100) / 100;
    const savings = Math.round(summary.totalSavingsBalance * 100) / 100;
    const obligations = Math.round(summary.totalMonthlyObligations * 100) / 100;
    const dr = Math.round(debtRatio * 10000) / 10000;
    const sc = Math.round(totalScore * 100) / 100;
    const efm = Math.round(emergencyFundMonths * 100) / 100;
    const pm = Math.round(profitMargin * 10000) / 10000;

    await db.execute(sql`
      INSERT INTO financial_snapshots (user_id, month, total_income, total_expenses, total_savings, total_obligations, debt_ratio, financial_score, emergency_fund_months, profit_margin)
      VALUES (${userId}, ${month}, ${income}, ${expenses}, ${savings}, ${obligations}, ${dr}, ${sc}, ${efm}, ${pm})
      ON CONFLICT (user_id, month)
      DO UPDATE SET
        total_income = EXCLUDED.total_income,
        total_expenses = EXCLUDED.total_expenses,
        total_savings = EXCLUDED.total_savings,
        total_obligations = EXCLUDED.total_obligations,
        debt_ratio = EXCLUDED.debt_ratio,
        financial_score = EXCLUDED.financial_score,
        emergency_fund_months = EXCLUDED.emergency_fund_months,
        profit_margin = EXCLUDED.profit_margin
    `);
  } catch (err) {
    console.error("Failed to update monthly snapshot:", err);
  }
}

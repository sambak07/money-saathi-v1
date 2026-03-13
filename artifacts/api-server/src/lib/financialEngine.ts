import { db, incomeEntriesTable, expenseEntriesTable, obligationsTable, savingsTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly": return amount * 4.33;
    case "yearly": return amount / 12;
    case "one_time": return amount / 12;
    default: return amount;
  }
}

export type ProfileMode = "individual" | "small_business";

export async function getProfileType(userId: number): Promise<ProfileMode> {
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId));
  return (profile?.profileType === "small_business") ? "small_business" : "individual";
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

export interface BusinessScoreBreakdown {
  totalScore: number;
  category: string;
  profitMargin: number;
  debtRatio: number;
  cashReserveMonths: number;
  revenueStabilityRatio: number;
  profitScore: number;
  debtScore: number;
  cashReserveScore: number;
  revenueStabilityScore: number;
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlyObligations: number;
  totalSavingsBalance: number;
  emergencyFundBalance: number;
  incomeSourceCount: number;
  incomeConcentration: number;
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

  let incomeConcentration = 0;
  if (totalMonthlyIncome > 0 && incomes.length > 0) {
    const shares = incomes.map(i => toMonthly(i.amount, i.frequency) / totalMonthlyIncome);
    const hhi = shares.reduce((sum, s) => sum + s * s, 0);
    incomeConcentration = hhi;
  }

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlyObligations,
    totalSavingsBalance,
    emergencyFundBalance,
    incomeSourceCount: incomes.length,
    incomeConcentration,
  };
}

function getCategory(totalScore: number): string {
  if (totalScore >= 80) return "Excellent";
  if (totalScore >= 65) return "Strong";
  if (totalScore >= 45) return "Moderate";
  if (totalScore >= 25) return "Risk";
  return "Critical";
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

  return {
    totalScore,
    category: getCategory(totalScore),
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

export function calculateBusinessScore(summary: FinancialSummary): BusinessScoreBreakdown {
  const revenue = summary.totalMonthlyIncome || 1;
  const opex = summary.totalMonthlyExpenses;
  const debt = summary.totalMonthlyObligations;
  const cashBalance = summary.totalSavingsBalance;

  const netProfit = revenue - opex - debt;
  const profitMargin = netProfit / revenue;
  const debtRatio = debt / revenue;
  const cashReserveMonths = cashBalance / (opex || 1);
  const hhi = summary.incomeConcentration || 0;
  const diversification = summary.incomeSourceCount > 1 ? (1 - hhi) : 0;
  const revenueStabilityRatio = summary.totalMonthlyIncome > 0
    ? Math.min(1, 0.5 + diversification * 0.5)
    : 0;

  let profitScore: number;
  if (profitMargin >= 0.2) profitScore = 25;
  else if (profitMargin >= 0.1) profitScore = 20;
  else if (profitMargin >= 0.05) profitScore = 15;
  else if (profitMargin >= 0) profitScore = 10;
  else profitScore = 5;

  let debtScore = 25;
  if (debtRatio > 0.5) debtScore = 5;
  else if (debtRatio > 0.4) debtScore = 10;
  else if (debtRatio > 0.3) debtScore = 15;
  else if (debtRatio > 0.2) debtScore = 20;

  let cashReserveScore = Math.min(25, cashReserveMonths * 8.33);
  if (cashReserveMonths >= 3) cashReserveScore = 25;

  let revenueStabilityScore: number;
  if (summary.totalMonthlyIncome <= 0) {
    revenueStabilityScore = 0;
  } else if (summary.incomeSourceCount >= 3 && hhi < 0.4) {
    revenueStabilityScore = 25;
  } else if (summary.incomeSourceCount >= 2 && hhi < 0.6) {
    revenueStabilityScore = 20;
  } else if (summary.incomeSourceCount >= 2) {
    revenueStabilityScore = 15;
  } else {
    revenueStabilityScore = 10;
  }

  const totalScore = Math.round(Math.min(100, Math.max(0, profitScore + debtScore + cashReserveScore + revenueStabilityScore)));

  return {
    totalScore,
    category: getCategory(totalScore),
    profitMargin: Math.round(profitMargin * 1000) / 1000,
    debtRatio: Math.round(debtRatio * 1000) / 1000,
    cashReserveMonths: Math.round(cashReserveMonths * 100) / 100,
    revenueStabilityRatio: Math.round(revenueStabilityRatio * 1000) / 1000,
    profitScore: Math.round(profitScore * 10) / 10,
    debtScore: Math.round(debtScore * 10) / 10,
    cashReserveScore: Math.round(cashReserveScore * 10) / 10,
    revenueStabilityScore: Math.round(revenueStabilityScore * 10) / 10,
  };
}

export interface Verdict {
  category: string;
  mainRisk: string;
  nextBestAction: string;
  hasData: boolean;
}

export function generateVerdict(summary: FinancialSummary, score: ScoreBreakdown): Verdict {
  const income = summary.totalMonthlyIncome;
  const hasData = income > 0 || summary.totalMonthlyExpenses > 0 || summary.totalSavingsBalance > 0 || summary.totalMonthlyObligations > 0;

  if (!hasData) {
    return {
      category: score.category,
      mainRisk: "No financial data entered yet",
      nextBestAction: "Add your monthly income to get started",
      hasData: false,
    };
  }

  if (income === 0) {
    return {
      category: score.category,
      mainRisk: "No income recorded",
      nextBestAction: "Add your monthly income so we can analyse your finances",
      hasData: true,
    };
  }

  const components = [
    { key: "debt", score: score.debtScore, ratio: score.debtRatio },
    { key: "savings", score: score.savingsScore, ratio: score.savingsRatio },
    { key: "emergency", score: score.emergencyScore, ratio: score.emergencyFundCoverage },
    { key: "expenses", score: score.expenseScore, ratio: score.expenseRatio },
  ];
  components.sort((a, b) => a.score - b.score);
  const weakest = components[0];

  let mainRisk: string;
  let nextBestAction: string;

  switch (weakest.key) {
    case "debt": {
      const debtPct = Math.round(score.debtRatio * 100);
      const excessDebt = Math.round(summary.totalMonthlyObligations - income * 0.3);
      mainRisk = `High debt burden (${debtPct}% of income)`;
      if (excessDebt > 0) {
        nextBestAction = `Reduce monthly debt payments by Nu. ${excessDebt.toLocaleString()} to reach the safe 30% threshold`;
      } else {
        nextBestAction = "Avoid new borrowing until debt ratio drops below 30%";
      }
      break;
    }
    case "savings": {
      const savPct = Math.round(score.savingsRatio * 100);
      const targetAnnual = income * 12 * 0.5;
      const gap = Math.round(Math.max(0, targetAnnual - summary.totalSavingsBalance));
      const monthlyGap = Math.round(gap / 12);
      mainRisk = `Low savings ratio (${savPct}% of annual income)`;
      if (monthlyGap > 0) {
        nextBestAction = `Increase monthly savings by Nu. ${monthlyGap.toLocaleString()} to build a strong reserve`;
      } else {
        nextBestAction = "Maintain current savings rate to stay on target";
      }
      break;
    }
    case "emergency": {
      const months = Math.round(score.emergencyFundCoverage * 10) / 10;
      const targetMonths = Math.max(3, 6 - months);
      const gap = Math.round(summary.totalMonthlyExpenses * targetMonths);
      mainRisk = `Weak emergency fund (${months} months of expenses)`;
      if (gap > 0 && months < 3) {
        nextBestAction = `Build a 3-month emergency fund — save Nu. ${gap.toLocaleString()} in an emergency account`;
      } else if (gap > 0) {
        nextBestAction = `Grow emergency fund to 6 months — save Nu. ${Math.round(summary.totalMonthlyExpenses * (6 - months)).toLocaleString()} more`;
      } else {
        nextBestAction = "Continue contributing to your emergency fund";
      }
      break;
    }
    case "expenses":
    default: {
      const expPct = Math.round(score.expenseRatio * 100);
      const safeExpenses = income * 0.7;
      const excess = Math.round(Math.max(0, summary.totalMonthlyExpenses - safeExpenses));
      mainRisk = `Expense ratio too high (${expPct}% of income)`;
      if (excess > 0) {
        nextBestAction = `Reduce monthly expenses by Nu. ${excess.toLocaleString()} to free up savings capacity`;
      } else {
        nextBestAction = "Review discretionary spending to keep expenses below 70% of income";
      }
      break;
    }
  }

  if (score.totalScore >= 80) {
    mainRisk = "No major risks detected";
    nextBestAction = "Continue maintaining your current financial habits";
  }

  return {
    category: score.category,
    mainRisk,
    nextBestAction,
    hasData,
  };
}

export function generateBusinessVerdict(summary: FinancialSummary, score: BusinessScoreBreakdown): Verdict {
  const revenue = summary.totalMonthlyIncome;
  const hasData = revenue > 0 || summary.totalMonthlyExpenses > 0 || summary.totalSavingsBalance > 0 || summary.totalMonthlyObligations > 0;

  if (!hasData) {
    return {
      category: score.category,
      mainRisk: "No business data entered yet",
      nextBestAction: "Add your monthly revenue to get started",
      hasData: false,
    };
  }

  if (revenue === 0) {
    return {
      category: score.category,
      mainRisk: "No revenue recorded",
      nextBestAction: "Add your monthly revenue so we can analyse your business health",
      hasData: true,
    };
  }

  if (score.totalScore >= 80) {
    return {
      category: score.category,
      mainRisk: "No major risks detected",
      nextBestAction: "Continue maintaining your current business performance",
      hasData: true,
    };
  }

  const components = [
    { key: "profit", score: score.profitScore },
    { key: "debt", score: score.debtScore },
    { key: "cash", score: score.cashReserveScore },
    { key: "revenue", score: score.revenueStabilityScore },
  ];
  components.sort((a, b) => a.score - b.score);
  const weakest = components[0];

  let mainRisk: string;
  let nextBestAction: string;

  switch (weakest.key) {
    case "profit": {
      const marginPct = Math.round(score.profitMargin * 100);
      const opex = summary.totalMonthlyExpenses;
      const targetOpex = revenue * 0.8;
      const excess = Math.round(Math.max(0, opex - targetOpex));
      mainRisk = `Low profit margin (${marginPct}% of revenue)`;
      if (excess > 0) {
        nextBestAction = `Reduce operating expenses by Nu. ${excess.toLocaleString()} to reach a 20% profit margin`;
      } else {
        nextBestAction = "Focus on increasing revenue or reducing costs to improve profitability";
      }
      break;
    }
    case "debt": {
      const debtPct = Math.round(score.debtRatio * 100);
      const excessDebt = Math.round(summary.totalMonthlyObligations - revenue * 0.3);
      mainRisk = `High debt-to-revenue ratio (${debtPct}%)`;
      if (excessDebt > 0) {
        nextBestAction = `Reduce monthly loan payments by Nu. ${excessDebt.toLocaleString()} to reach the safe 30% threshold`;
      } else {
        nextBestAction = "Avoid new borrowing until the debt ratio drops below 30%";
      }
      break;
    }
    case "cash": {
      const months = Math.round(score.cashReserveMonths * 10) / 10;
      const targetMonths = Math.max(1, 3 - months);
      const gap = Math.round(summary.totalMonthlyExpenses * targetMonths);
      mainRisk = `Insufficient cash reserve (${months} months of expenses)`;
      if (gap > 0) {
        nextBestAction = `Build a 3-month operating reserve — save Nu. ${gap.toLocaleString()} in a business savings account`;
      } else {
        nextBestAction = "Continue building your cash reserve for business continuity";
      }
      break;
    }
    case "revenue":
    default: {
      mainRisk = "Revenue stability needs attention";
      nextBestAction = "Diversify revenue streams and secure recurring contracts to stabilise income";
      break;
    }
  }

  return {
    category: score.category,
    mainRisk,
    nextBestAction,
    hasData,
  };
}

export function generateVerdictFromReport(report: {
  totalIncome: number; totalExpenses: number; totalDebt: number;
  totalSavings: number; netSavings: number; financialScore: number; scoreCategory: string;
}): { mainRisk: string; nextBestAction: string } {
  const income = report.totalIncome || 1;
  const debtRatio = report.totalDebt / income;
  const expenseRatio = report.totalExpenses / income;
  const savingsRatio = report.totalSavings / (income * 12);
  const score = report.financialScore;

  if (score >= 80) {
    return { mainRisk: "No major risks detected", nextBestAction: "Continue maintaining your current financial habits" };
  }

  const risks = [
    { key: "debt", severity: debtRatio > 0.3 ? debtRatio : 0 },
    { key: "expenses", severity: expenseRatio > 0.7 ? expenseRatio : 0 },
    { key: "savings", severity: savingsRatio < 0.5 ? (0.5 - savingsRatio) : 0 },
  ];
  risks.sort((a, b) => b.severity - a.severity);
  const top = risks[0];

  switch (top.key) {
    case "debt": {
      const excess = Math.round(report.totalDebt - income * 0.3);
      return {
        mainRisk: `High debt burden (${Math.round(debtRatio * 100)}% of income)`,
        nextBestAction: excess > 0 ? `Reduce monthly debt by Nu. ${excess.toLocaleString()}` : "Avoid new borrowing",
      };
    }
    case "expenses": {
      const excess = Math.round(report.totalExpenses - income * 0.7);
      return {
        mainRisk: `Expense ratio too high (${Math.round(expenseRatio * 100)}% of income)`,
        nextBestAction: excess > 0 ? `Reduce expenses by Nu. ${excess.toLocaleString()}` : "Review discretionary spending",
      };
    }
    default: {
      const gap = Math.round((income * 12 * 0.5 - report.totalSavings) / 12);
      return {
        mainRisk: `Low savings ratio (${Math.round(savingsRatio * 100)}% of annual income)`,
        nextBestAction: gap > 0 ? `Increase monthly savings by Nu. ${gap.toLocaleString()}` : "Maintain savings rate",
      };
    }
  }
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

export function generateBusinessAdvisory(summary: FinancialSummary, score: BusinessScoreBreakdown): AdvisoryItem[] {
  const recommendations: AdvisoryItem[] = [];

  if (score.profitScore < 20) {
    recommendations.push({
      category: "profit",
      title: "Improve Profit Margin",
      description: `Your profit margin is ${Math.round(score.profitMargin * 100)}% of revenue. Aim for at least 20% for a healthy business.`,
      priority: score.profitScore < 10 ? "high" : "medium",
      currentValue: Math.round(score.profitMargin * 100),
      targetValue: 20,
    });
  }

  if (score.debtScore < 20) {
    recommendations.push({
      category: "debt",
      title: "Reduce Business Debt",
      description: `Your monthly loan payments are ${Math.round(score.debtRatio * 100)}% of revenue. Keep it below 30%.`,
      priority: score.debtScore < 15 ? "high" : "medium",
      currentValue: Math.round(score.debtRatio * 100),
      targetValue: 30,
    });
  }

  if (score.cashReserveScore < 20) {
    recommendations.push({
      category: "cash_reserve",
      title: "Build Cash Reserve",
      description: `Your cash reserve covers ${score.cashReserveMonths.toFixed(1)} months of operating expenses. Aim for at least 3 months.`,
      priority: score.cashReserveMonths < 1 ? "high" : "medium",
      currentValue: Math.round(score.cashReserveMonths * 10) / 10,
      targetValue: 3,
    });
  }

  if (score.revenueStabilityScore < 20) {
    recommendations.push({
      category: "revenue",
      title: "Stabilise Revenue",
      description: "Diversify income sources and secure recurring contracts for predictable cash flow.",
      priority: "high",
      currentValue: Math.round(score.revenueStabilityRatio * 100),
      targetValue: 100,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: "profit",
      title: "Strong Business Health!",
      description: "Your business finances are in great shape. Focus on growth and market expansion.",
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

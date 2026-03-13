import type { FinancialSummary, ScoreBreakdown, BusinessScoreBreakdown } from "./financialEngine";

export interface FinancialInsight {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  explanation: string;
  recommendedAction: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  literacyLink: { label: string; path: string };
}

export function generateIndividualInsights(summary: FinancialSummary, score: ScoreBreakdown): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const income = summary.totalMonthlyIncome;

  if (income <= 0) return [];

  const savingsRate = summary.totalSavingsBalance / (income * 12);
  if (savingsRate < 0.1) {
    insights.push({
      id: "low-savings",
      severity: "critical",
      title: "Low Savings Warning",
      explanation: `Your total savings are only ${Math.round(savingsRate * 100)}% of your annual income (Nu. ${Math.round(summary.totalSavingsBalance).toLocaleString()} saved vs Nu. ${Math.round(income * 12).toLocaleString()} annual income). Financial experts recommend saving at least 50% of annual income as a reserve. At your current pace, you may not have enough to handle unexpected expenses or achieve long-term goals.`,
      recommendedAction: `Start by setting aside at least 20% of your monthly income — that's Nu. ${Math.round(income * 0.2).toLocaleString()} per month. Open a recurring deposit at any Bhutanese bank to automate this. Even small, consistent deposits in BOB or BNB savings accounts will compound over time.`,
      metric: "Savings Rate",
      currentValue: Math.round(savingsRate * 100),
      targetValue: 50,
      literacyLink: { label: "Learn about Long-Term Savings Strategies", path: "/intelligence/literacy" },
    });
  } else if (savingsRate < 0.3) {
    insights.push({
      id: "moderate-savings",
      severity: "warning",
      title: "Savings Could Be Stronger",
      explanation: `Your savings ratio is ${Math.round(savingsRate * 100)}% of annual income. While you're saving, there's room to grow. A healthy target is 50% of annual income to protect against Bhutan's seasonal economic fluctuations.`,
      recommendedAction: `Increase monthly savings by Nu. ${Math.round(Math.max(0, income * 0.3 - (summary.totalSavingsBalance / 12))).toLocaleString()}. Consider a fixed deposit at T Bank (up to 9% returns) or BDB for higher interest on locked savings.`,
      metric: "Savings Rate",
      currentValue: Math.round(savingsRate * 100),
      targetValue: 50,
      literacyLink: { label: "Learn about Long-Term Savings Strategies", path: "/intelligence/literacy" },
    });
  } else if (savingsRate >= 0.5) {
    insights.push({
      id: "strong-savings",
      severity: "positive",
      title: "Strong Savings Discipline",
      explanation: `Your savings are ${Math.round(savingsRate * 100)}% of annual income — excellent work! This puts you well ahead of the recommended 50% benchmark and provides a solid financial cushion.`,
      recommendedAction: `Consider diversifying into higher-return investments. Explore fixed deposits at Bhutanese banks for guaranteed returns, or look into RSEBL stocks for long-term wealth building.`,
      metric: "Savings Rate",
      currentValue: Math.round(savingsRate * 100),
      targetValue: 50,
      literacyLink: { label: "Explore Investment Options", path: "/intelligence/invest" },
    });
  }

  const expenseRatio = summary.totalMonthlyExpenses / income;
  if (expenseRatio > 0.8) {
    insights.push({
      id: "high-expenses",
      severity: "critical",
      title: "Expenses Consuming Most of Income",
      explanation: `Your monthly expenses (Nu. ${Math.round(summary.totalMonthlyExpenses).toLocaleString()}) consume ${Math.round(expenseRatio * 100)}% of your income. This leaves very little room for savings, debt payments, or emergencies. The recommended target is to keep expenses below 70% of income.`,
      recommendedAction: `Identify and reduce discretionary spending by Nu. ${Math.round(summary.totalMonthlyExpenses - income * 0.7).toLocaleString()} per month. Track daily expenses for one month to find patterns. Consider cheaper alternatives for recurring costs like mobile plans and subscriptions.`,
      metric: "Expense Ratio",
      currentValue: Math.round(expenseRatio * 100),
      targetValue: 70,
      literacyLink: { label: "Understanding Debt & Expense Ratios", path: "/intelligence/literacy" },
    });
  } else if (expenseRatio > 0.7) {
    insights.push({
      id: "elevated-expenses",
      severity: "warning",
      title: "Expense Ratio Above Target",
      explanation: `Your expenses are ${Math.round(expenseRatio * 100)}% of income — slightly above the recommended 70% threshold. Bringing this down would free up more for savings and investments.`,
      recommendedAction: `Try to reduce monthly spending by Nu. ${Math.round(summary.totalMonthlyExpenses - income * 0.7).toLocaleString()}. Review utility bills, transport costs, and discretionary purchases. Small changes add up over a year.`,
      metric: "Expense Ratio",
      currentValue: Math.round(expenseRatio * 100),
      targetValue: 70,
      literacyLink: { label: "Understanding Debt & Expense Ratios", path: "/intelligence/literacy" },
    });
  }

  const debtToIncomeRatio = summary.totalMonthlyObligations / income;
  if (debtToIncomeRatio > 0.5) {
    insights.push({
      id: "high-debt",
      severity: "critical",
      title: "High Debt Burden Alert",
      explanation: `Your monthly debt payments (Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}) are ${Math.round(debtToIncomeRatio * 100)}% of your income. Bhutanese banks typically reject new loans when debt exceeds 50% of income. This level of debt seriously limits your financial flexibility.`,
      recommendedAction: `Prioritise paying off the highest-interest debt first (avalanche method). Contact your bank about loan restructuring — BOB and BNB offer refinancing options. Avoid taking any new loans until the ratio drops below 30%.`,
      metric: "Debt-to-Income Ratio",
      currentValue: Math.round(debtToIncomeRatio * 100),
      targetValue: 30,
      literacyLink: { label: "Understanding Debt Ratios", path: "/intelligence/literacy" },
    });
  } else if (debtToIncomeRatio > 0.3) {
    insights.push({
      id: "moderate-debt",
      severity: "warning",
      title: "Debt Ratio Needs Attention",
      explanation: `Your debt-to-income ratio is ${Math.round(debtToIncomeRatio * 100)}% — above the recommended 30% threshold. While manageable, this limits your ability to save and may affect loan eligibility.`,
      recommendedAction: `Focus on paying down Nu. ${Math.round(summary.totalMonthlyObligations - income * 0.3).toLocaleString()} extra per month on your highest-interest obligations. Consider the snowball method — pay off smaller debts first for momentum.`,
      metric: "Debt-to-Income Ratio",
      currentValue: Math.round(debtToIncomeRatio * 100),
      targetValue: 30,
      literacyLink: { label: "Understanding Debt Ratios", path: "/intelligence/literacy" },
    });
  }

  const emergencyMonths = summary.emergencyFundBalance / (summary.totalMonthlyExpenses || 1);
  if (emergencyMonths < 1) {
    insights.push({
      id: "no-emergency-fund",
      severity: "critical",
      title: "Emergency Fund Critically Low",
      explanation: `Your emergency fund covers only ${Math.round(emergencyMonths * 10) / 10} months of expenses. In Bhutan, where healthcare costs and natural disasters can arise unexpectedly, having no safety net is a serious risk. Financial experts recommend at least 3-6 months of coverage.`,
      recommendedAction: `Open a dedicated emergency savings account at BOB or BNB. Start with a goal of Nu. ${Math.round(summary.totalMonthlyExpenses * 3).toLocaleString()} (3 months of expenses). Set up automatic monthly transfers of at least Nu. ${Math.round(summary.totalMonthlyExpenses * 0.5).toLocaleString()}.`,
      metric: "Emergency Fund",
      currentValue: Math.round(emergencyMonths * 10) / 10,
      targetValue: 6,
      literacyLink: { label: "Building an Emergency Fund", path: "/intelligence/literacy" },
    });
  } else if (emergencyMonths < 3) {
    insights.push({
      id: "weak-emergency-fund",
      severity: "warning",
      title: "Emergency Fund Below Target",
      explanation: `Your emergency fund covers ${Math.round(emergencyMonths * 10) / 10} months of expenses. While better than nothing, the recommended minimum is 3 months, with 6 months being ideal for full protection.`,
      recommendedAction: `Continue building towards Nu. ${Math.round(summary.totalMonthlyExpenses * 6).toLocaleString()} (6 months of expenses). You need Nu. ${Math.round(summary.totalMonthlyExpenses * (3 - emergencyMonths)).toLocaleString()} more to reach the 3-month milestone.`,
      metric: "Emergency Fund",
      currentValue: Math.round(emergencyMonths * 10) / 10,
      targetValue: 6,
      literacyLink: { label: "Building an Emergency Fund", path: "/intelligence/literacy" },
    });
  } else if (emergencyMonths >= 6) {
    insights.push({
      id: "strong-emergency-fund",
      severity: "positive",
      title: "Emergency Fund Well-Stocked",
      explanation: `Your emergency fund covers ${Math.round(emergencyMonths * 10) / 10} months of expenses — exceeding the recommended 6-month target. This provides excellent protection against unexpected events.`,
      recommendedAction: `Your emergency fund is in great shape. Consider putting excess savings into higher-return options like fixed deposits or RSEBL investments for long-term growth.`,
      metric: "Emergency Fund",
      currentValue: Math.round(emergencyMonths * 10) / 10,
      targetValue: 6,
      literacyLink: { label: "Explore Investment Options", path: "/intelligence/invest" },
    });
  }

  const maxAffordableEMI = income * 0.3 - summary.totalMonthlyObligations;
  if (maxAffordableEMI < 0) {
    insights.push({
      id: "loan-unaffordable",
      severity: "warning",
      title: "Loan Affordability Limited",
      explanation: `Based on your current debt load, you cannot afford additional loan EMIs. Banks calculate affordability using the 30% debt-to-income rule, and your obligations already exceed this threshold.`,
      recommendedAction: `Pay down existing obligations before applying for new loans. Use the Money Saathi Loan Calculator to see exactly how much you could borrow once your debt ratio improves.`,
      metric: "Affordable EMI",
      currentValue: 0,
      targetValue: Math.round(income * 0.3),
      literacyLink: { label: "Understanding EMI & Loan Affordability", path: "/intelligence/literacy" },
    });
  } else if (maxAffordableEMI > 0 && debtToIncomeRatio > 0.15) {
    insights.push({
      id: "loan-affordability",
      severity: "info",
      title: "Loan Affordability Guidance",
      explanation: `Based on the 30% debt-to-income rule used by Bhutanese banks, your maximum affordable additional EMI is Nu. ${Math.round(maxAffordableEMI).toLocaleString()} per month. This factors in your existing obligations of Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}/month.`,
      recommendedAction: `Before taking any new loan, use the Loan Calculator to check if the EMI fits within Nu. ${Math.round(maxAffordableEMI).toLocaleString()}/month. Compare rates across BOB, BNB, and BDB — even 0.5% difference saves thousands over the loan tenure.`,
      metric: "Affordable EMI",
      currentValue: Math.round(maxAffordableEMI),
      targetValue: Math.round(income * 0.3),
      literacyLink: { label: "Understanding EMI & Loan Affordability", path: "/intelligence/literacy" },
    });
  }

  insights.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return insights;
}

export function generateBusinessInsights(summary: FinancialSummary, score: BusinessScoreBreakdown): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const revenue = summary.totalMonthlyIncome;

  if (revenue <= 0) return [];

  const profitMargin = score.profitMargin;
  if (profitMargin < 0) {
    insights.push({
      id: "negative-profit",
      severity: "critical",
      title: "Business Operating at a Loss",
      explanation: `Your business is running at a ${Math.round(Math.abs(profitMargin) * 100)}% loss — expenses and debt exceed revenue by Nu. ${Math.round(Math.abs(revenue * profitMargin)).toLocaleString()} per month. Sustained losses deplete cash reserves and threaten business continuity.`,
      recommendedAction: `Immediately review all operating expenses and cut non-essential costs. Negotiate better terms with suppliers. Consider raising prices if the market allows. If losses persist, consult with BDB's business advisory services.`,
      metric: "Profit Margin",
      currentValue: Math.round(profitMargin * 100),
      targetValue: 20,
      literacyLink: { label: "Understanding Debt & Business Ratios", path: "/intelligence/literacy" },
    });
  } else if (profitMargin < 0.1) {
    insights.push({
      id: "low-profit-margin",
      severity: "warning",
      title: "Low Profit Margin",
      explanation: `Your profit margin is ${Math.round(profitMargin * 100)}% — below the recommended 20% for a healthy Bhutanese business. Thin margins leave little room for growth, investment, or handling unexpected costs.`,
      recommendedAction: `Focus on either increasing revenue (expand customer base, add services) or reducing operating expenses by Nu. ${Math.round(revenue * 0.1).toLocaleString()} per month. Explore BDB's small business development programs for support.`,
      metric: "Profit Margin",
      currentValue: Math.round(profitMargin * 100),
      targetValue: 20,
      literacyLink: { label: "Understanding Debt & Business Ratios", path: "/intelligence/literacy" },
    });
  } else if (profitMargin >= 0.2) {
    insights.push({
      id: "strong-profit",
      severity: "positive",
      title: "Healthy Profit Margin",
      explanation: `Your business maintains a ${Math.round(profitMargin * 100)}% profit margin — above the 20% benchmark. This indicates strong operational efficiency and pricing power.`,
      recommendedAction: `Reinvest profits strategically: build cash reserves, upgrade equipment, or explore expansion. Consider RSEBL investments for surplus funds to generate passive income alongside your business.`,
      metric: "Profit Margin",
      currentValue: Math.round(profitMargin * 100),
      targetValue: 20,
      literacyLink: { label: "Explore Investment Options", path: "/intelligence/invest" },
    });
  }

  const opexRatio = summary.totalMonthlyExpenses / revenue;
  if (opexRatio > 0.8) {
    insights.push({
      id: "high-opex",
      severity: "critical",
      title: "Operating Expenses Too High",
      explanation: `Operating expenses consume ${Math.round(opexRatio * 100)}% of revenue (Nu. ${Math.round(summary.totalMonthlyExpenses).toLocaleString()} of Nu. ${Math.round(revenue).toLocaleString()}). This leaves very little for debt service, reinvestment, or profit distribution.`,
      recommendedAction: `Audit every expense category. Identify the top 3 costs and find ways to reduce each by 10-15%. Consider renegotiating rent, switching suppliers, or automating manual processes to cut payroll costs.`,
      metric: "Operating Expense Ratio",
      currentValue: Math.round(opexRatio * 100),
      targetValue: 70,
      literacyLink: { label: "Understanding Debt & Business Ratios", path: "/intelligence/literacy" },
    });
  } else if (opexRatio > 0.7) {
    insights.push({
      id: "elevated-opex",
      severity: "warning",
      title: "Operating Expenses Above Target",
      explanation: `Operating expenses are ${Math.round(opexRatio * 100)}% of revenue — above the 70% target. Reducing this ratio will directly improve your profit margin and business resilience.`,
      recommendedAction: `Target reducing operational costs by Nu. ${Math.round(summary.totalMonthlyExpenses - revenue * 0.7).toLocaleString()} per month. Focus on the largest expense categories for the biggest impact.`,
      metric: "Operating Expense Ratio",
      currentValue: Math.round(opexRatio * 100),
      targetValue: 70,
      literacyLink: { label: "Understanding Debt & Business Ratios", path: "/intelligence/literacy" },
    });
  }

  const debtToRevenue = summary.totalMonthlyObligations / revenue;
  if (debtToRevenue > 0.4) {
    insights.push({
      id: "high-business-debt",
      severity: "critical",
      title: "Business Debt Burden Alert",
      explanation: `Business debt payments are ${Math.round(debtToRevenue * 100)}% of revenue — well above the safe 30% threshold. Heavy debt servicing can choke cash flow and prevent business growth.`,
      recommendedAction: `Contact your lending bank about loan restructuring or tenure extension to reduce monthly payments. Prioritise paying off high-interest business loans first. Avoid new borrowing until the ratio drops below 30%.`,
      metric: "Debt-to-Revenue Ratio",
      currentValue: Math.round(debtToRevenue * 100),
      targetValue: 30,
      literacyLink: { label: "Understanding Debt Ratios", path: "/intelligence/literacy" },
    });
  } else if (debtToRevenue > 0.3) {
    insights.push({
      id: "moderate-business-debt",
      severity: "warning",
      title: "Business Debt Ratio Elevated",
      explanation: `Debt payments are ${Math.round(debtToRevenue * 100)}% of revenue — slightly above the recommended 30% threshold. While manageable, this limits cash available for operations and growth.`,
      recommendedAction: `Allocate extra funds towards paying down business loans. Compare refinancing options across BOB, BNB, and BDB for better rates.`,
      metric: "Debt-to-Revenue Ratio",
      currentValue: Math.round(debtToRevenue * 100),
      targetValue: 30,
      literacyLink: { label: "Understanding Debt Ratios", path: "/intelligence/literacy" },
    });
  }

  const cashReserveMonths = score.cashReserveMonths;
  if (cashReserveMonths < 1) {
    insights.push({
      id: "low-cash-reserve",
      severity: "critical",
      title: "Business Cash Reserve Warning",
      explanation: `Your cash reserves cover only ${Math.round(cashReserveMonths * 10) / 10} months of operating expenses. Bhutanese businesses face seasonal revenue fluctuations — without adequate reserves, a slow month could force emergency borrowing at high rates.`,
      recommendedAction: `Build a business emergency fund of at least Nu. ${Math.round(summary.totalMonthlyExpenses * 3).toLocaleString()} (3 months of operating costs). Open a separate business savings account and transfer profits consistently.`,
      metric: "Cash Reserve Months",
      currentValue: Math.round(cashReserveMonths * 10) / 10,
      targetValue: 3,
      literacyLink: { label: "Building an Emergency Fund", path: "/intelligence/literacy" },
    });
  } else if (cashReserveMonths < 3) {
    insights.push({
      id: "building-cash-reserve",
      severity: "warning",
      title: "Cash Reserves Below Target",
      explanation: `Your cash reserves cover ${Math.round(cashReserveMonths * 10) / 10} months of operating expenses. The recommended minimum is 3 months to weather seasonal dips and unexpected costs.`,
      recommendedAction: `You need Nu. ${Math.round(summary.totalMonthlyExpenses * (3 - cashReserveMonths)).toLocaleString()} more to reach 3 months of coverage. Set aside a fixed percentage of monthly profits into a business reserve account.`,
      metric: "Cash Reserve Months",
      currentValue: Math.round(cashReserveMonths * 10) / 10,
      targetValue: 3,
      literacyLink: { label: "Building an Emergency Fund", path: "/intelligence/literacy" },
    });
  } else if (cashReserveMonths >= 3) {
    insights.push({
      id: "strong-cash-reserve",
      severity: "positive",
      title: "Solid Cash Reserves",
      explanation: `Your business has ${Math.round(cashReserveMonths * 10) / 10} months of operating expenses in reserve — meeting the recommended 3-month minimum. This provides a strong buffer against revenue fluctuations.`,
      recommendedAction: `Your reserves are healthy. Consider investing excess cash in short-term fixed deposits at Bhutanese banks for better returns while maintaining liquidity.`,
      metric: "Cash Reserve Months",
      currentValue: Math.round(cashReserveMonths * 10) / 10,
      targetValue: 3,
      literacyLink: { label: "Compare Bank Products", path: "/intelligence/banks" },
    });
  }

  const revenueStability = score.revenueStabilityRatio;
  if (summary.incomeSourceCount <= 1) {
    insights.push({
      id: "revenue-concentration",
      severity: "warning",
      title: "Revenue Source Concentration Risk",
      explanation: `Your business relies on a single revenue source. If this stream is disrupted, your entire income stops. Diversified businesses are more resilient to market changes and client loss.`,
      recommendedAction: `Explore adding complementary revenue streams: new products, services, or customer segments. Consider recurring revenue models (subscriptions, retainers) for more predictable cash flow.`,
      metric: "Revenue Stability",
      currentValue: Math.round(revenueStability * 100),
      targetValue: 100,
      literacyLink: { label: "Long-Term Wealth Planning", path: "/intelligence/invest" },
    });
  }

  insights.sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return insights;
}

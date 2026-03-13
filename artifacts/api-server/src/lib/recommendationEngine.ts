import { db, financialProductsTable } from "@workspace/db";
import type { FinancialSummary, ScoreBreakdown, BusinessScoreBreakdown, ProfileMode } from "./financialEngine";

export interface ProductRecommendation {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  whyItFits: string;
  keyFeature: string;
  sourceUrl: string | null;
  lastUpdated: string;
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  cautionMessage: string | null;
}

export async function generateProductRecommendations(
  summary: FinancialSummary,
  profileType: ProfileMode,
  individualScore?: ScoreBreakdown,
  businessScore?: BusinessScoreBreakdown,
): Promise<RecommendationResult> {
  const income = summary.totalMonthlyIncome;
  if (income <= 0) {
    return { recommendations: [], cautionMessage: null };
  }

  const allProducts = await db
    .select()
    .from(financialProductsTable)
    .orderBy(financialProductsTable.institutionName);

  if (allProducts.length === 0) {
    return { recommendations: [], cautionMessage: null };
  }

  if (profileType === "small_business" && businessScore) {
    return matchBusinessProducts(summary, businessScore, allProducts);
  }

  if (individualScore) {
    return matchIndividualProducts(summary, individualScore, allProducts);
  }

  return { recommendations: [], cautionMessage: null };
}

function matchIndividualProducts(
  summary: FinancialSummary,
  score: ScoreBreakdown,
  products: any[],
): RecommendationResult {
  const income = summary.totalMonthlyIncome;
  const debtRatio = score.debtRatio;
  const savingsRatio = score.savingsRatio;
  const emergencyMonths = score.emergencyFundCoverage;
  const totalScore = score.totalScore;

  const isHighDebt = debtRatio > 0.5;
  const isCritical = totalScore < 25;

  if (isCritical && isHighDebt) {
    return {
      recommendations: [],
      cautionMessage: `Your financial health score is ${totalScore}/100 with a debt ratio of ${Math.round(debtRatio * 100)}%. Before considering new financial products, focus on reducing your monthly debt payments below 30% of income (currently Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}/month). Pay off high-interest loans first, avoid new borrowing, and build a small emergency buffer. Visit the Financial Literacy Center for a step-by-step debt reduction plan.`,
    };
  }

  const candidates: Array<ProductRecommendation & { priority: number }> = [];
  const savingsProducts = products.filter(p => p.productCategory === "savings");
  const fdProducts = products.filter(p => p.productCategory === "fd");
  const housingProducts = products.filter(p => p.productCategory === "housing");
  const personalProducts = products.filter(p => p.productCategory === "personal");
  const educationProducts = products.filter(p => p.productCategory === "education");

  if (emergencyMonths < 3 && savingsProducts.length > 0) {
    const best = pickBestSavings(savingsProducts, "low_minimum");
    if (best) {
      const gap = Math.round(summary.totalMonthlyExpenses * (3 - emergencyMonths));
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your emergency fund covers only ${Math.round(emergencyMonths * 10) / 10} months of expenses. This savings account has a low minimum balance requirement, making it easy to start building your emergency reserve of Nu. ${gap.toLocaleString()}.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        priority: 1,
      });
    }
  }

  if (savingsRatio < 0.3 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your savings are ${Math.round(savingsRatio * 100)}% of annual income — below the recommended 50%. A fixed deposit locks in guaranteed returns and builds disciplined saving habits. Start with a 1-year FD while you grow your savings base.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        priority: 2,
      });
    }
  }

  if (savingsRatio >= 0.5 && emergencyMonths >= 6 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your savings are strong at ${Math.round(savingsRatio * 100)}% of annual income with ${Math.round(emergencyMonths * 10) / 10} months of emergency coverage. A fixed deposit can grow your surplus funds at higher rates than a regular savings account.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        priority: 4,
      });
    }
  }

  if (debtRatio < 0.3 && totalScore >= 45 && housingProducts.length > 0) {
    const maxEMI = income * 0.3 - summary.totalMonthlyObligations;
    if (maxEMI > 5000) {
      const best = pickLowestRate(housingProducts);
      if (best) {
        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Your debt ratio is a healthy ${Math.round(debtRatio * 100)}%, leaving room for Nu. ${Math.round(maxEMI).toLocaleString()}/month in EMI capacity. This housing loan offers competitive rates with a long tenure to keep monthly payments affordable.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | Tenure: ${best.tenure || "—"} | ${best.fees ? `Fee: ${best.fees}` : ""}`,
          priority: 5,
        });
      }
    }
  }

  if (isHighDebt) {
    const cautionMsg = `Your debt-to-income ratio is ${Math.round(debtRatio * 100)}% — above the safe 50% threshold. New borrowing is not recommended right now. Focus on paying down existing debt before considering loan products.`;
    const nonLoanCandidates = candidates.filter(c =>
      !["housing", "personal", "education"].includes(c.productCategory)
    );
    nonLoanCandidates.forEach(c => { (c as any).cautionNote = cautionMsg; });

    return {
      recommendations: nonLoanCandidates.sort((a, b) => a.priority - b.priority).slice(0, 3),
      cautionMessage: cautionMsg,
    };
  }

  if (debtRatio < 0.25 && totalScore >= 55 && personalProducts.length > 0) {
    const maxEMI = income * 0.3 - summary.totalMonthlyObligations;
    if (maxEMI > 3000) {
      const best = pickLowestRate(personalProducts);
      if (best) {
        candidates.push({
          ...toRecommendation(best),
          whyItFits: `With a low debt ratio of ${Math.round(debtRatio * 100)}% and a health score of ${totalScore}/100, you have capacity for a personal loan EMI of up to Nu. ${Math.round(maxEMI).toLocaleString()}/month. This option offers competitive rates with flexible tenure.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | ${best.keyFeatures || ""}`,
          priority: 6,
        });
      }
    }
  }

  if (debtRatio < 0.2 && totalScore >= 50 && educationProducts.length > 0) {
    const best = pickLowestRate(educationProducts);
    if (best) {
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your financial health (${totalScore}/100) and low debt ratio (${Math.round(debtRatio * 100)}%) make education financing viable. Education loans often have deferred repayment, so they won't immediately impact your monthly budget.`,
        keyFeature: `Rate: ${best.interestRate || "—"} | Repayment: ${best.tenure || "—"}`,
        priority: 7,
      });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return {
    recommendations: candidates.slice(0, 3),
    cautionMessage: null,
  };
}

function matchBusinessProducts(
  summary: FinancialSummary,
  score: BusinessScoreBreakdown,
  products: any[],
): RecommendationResult {
  const revenue = summary.totalMonthlyIncome;
  const debtRatio = score.debtRatio;
  const profitMargin = score.profitMargin;
  const cashMonths = score.cashReserveMonths;
  const totalScore = score.totalScore;

  const isHighDebt = debtRatio > 0.5;
  const isCritical = totalScore < 25;

  if (isCritical && isHighDebt) {
    return {
      recommendations: [],
      cautionMessage: `Your business health score is ${totalScore}/100 with debt consuming ${Math.round(debtRatio * 100)}% of revenue. Before considering new financial products, stabilise operations: reduce operating expenses, negotiate better payment terms with creditors, and build a minimum 1-month cash reserve. Avoid new borrowing until the debt-to-revenue ratio drops below 30%.`,
    };
  }

  const candidates: Array<ProductRecommendation & { priority: number }> = [];
  const savingsProducts = products.filter(p => p.productCategory === "savings");
  const fdProducts = products.filter(p => p.productCategory === "fd");
  const housingProducts = products.filter(p => p.productCategory === "housing");
  const personalProducts = products.filter(p => p.productCategory === "personal");

  if (cashMonths < 3 && savingsProducts.length > 0) {
    const best = pickBestSavings(savingsProducts, "features");
    if (best) {
      const gap = Math.round(summary.totalMonthlyExpenses * (3 - cashMonths));
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your business cash reserve covers only ${Math.round(cashMonths * 10) / 10} months of operating expenses — below the recommended 3 months. Open a dedicated business savings account to build an operating reserve of Nu. ${gap.toLocaleString()}.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        priority: 1,
      });
    }
  }

  if (profitMargin >= 0.1 && cashMonths >= 2 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      const monthlySurplus = Math.round(revenue * profitMargin * 0.3);
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `With a ${Math.round(profitMargin * 100)}% profit margin and ${Math.round(cashMonths * 10) / 10} months of reserves, you can park surplus funds (roughly Nu. ${monthlySurplus.toLocaleString()}/month) in a fixed deposit for guaranteed returns while maintaining liquidity.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        priority: 3,
      });
    }
  }

  if (isHighDebt) {
    const cautionMsg = `Your business debt-to-revenue ratio is ${Math.round(debtRatio * 100)}% — above the safe threshold. New borrowing is not recommended. Focus on debt reduction and operational efficiency before considering loan products.`;
    const nonLoanCandidates = candidates.filter(c =>
      !["housing", "personal", "education"].includes(c.productCategory)
    );
    return {
      recommendations: nonLoanCandidates.sort((a, b) => a.priority - b.priority).slice(0, 3),
      cautionMessage: cautionMsg,
    };
  }

  if (debtRatio < 0.3 && profitMargin >= 0.1 && totalScore >= 45) {
    const maxEMI = revenue * 0.3 - summary.totalMonthlyObligations;

    if (maxEMI > 10000 && personalProducts.length > 0) {
      const best = pickLowestRate(personalProducts);
      if (best) {
        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Your business has a healthy ${Math.round(profitMargin * 100)}% profit margin and low debt ratio (${Math.round(debtRatio * 100)}%). You can afford additional EMI of up to Nu. ${Math.round(maxEMI).toLocaleString()}/month for working capital or expansion needs.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | ${best.keyFeatures || ""}`,
          priority: 5,
        });
      }
    }

    if (maxEMI > 15000 && housingProducts.length > 0) {
      const best = pickLowestRate(housingProducts);
      if (best) {
        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Strong business performance (score: ${totalScore}/100, profit margin: ${Math.round(profitMargin * 100)}%) supports property investment. A commercial property loan could help your business own rather than rent premises, building long-term equity.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | Tenure: ${best.tenure || "—"}`,
          priority: 6,
        });
      }
    }
  }

  if (profitMargin < 0 && savingsProducts.length > 0 && candidates.length === 0) {
    const best = pickBestSavings(savingsProducts, "low_minimum");
    if (best) {
      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your business is currently operating at a loss. Before any other financial product, the priority is to build a cash buffer. Start with a simple savings account to set aside any available funds as a safety net.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        priority: 1,
      });
    }

    return {
      recommendations: candidates.slice(0, 3),
      cautionMessage: `Your business is running at a ${Math.round(Math.abs(profitMargin) * 100)}% loss. Focus on reaching profitability before taking on financial products. Reduce operating costs and grow revenue as the first priority.`,
    };
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return {
    recommendations: candidates.slice(0, 3),
    cautionMessage: null,
  };
}

function toRecommendation(product: any): ProductRecommendation {
  return {
    id: product.id,
    institutionName: product.institutionName,
    productName: product.productName,
    productCategory: product.productCategory,
    whyItFits: "",
    keyFeature: "",
    sourceUrl: product.sourceUrl,
    lastUpdated: product.lastUpdated?.toISOString?.() || new Date(product.lastUpdated).toISOString(),
  };
}

function parseMinBalance(str: string | null): number {
  if (!str) return Infinity;
  const num = str.replace(/[^0-9.]/g, "");
  return parseFloat(num) || Infinity;
}

function pickBestSavings(products: any[], strategy: "low_minimum" | "features"): any | null {
  if (products.length === 0) return null;
  if (strategy === "low_minimum") {
    return [...products].sort((a, b) => parseMinBalance(a.minimumBalance) - parseMinBalance(b.minimumBalance))[0];
  }
  return products[0];
}

function pickBestFD(products: any[]): any | null {
  if (products.length === 0) return null;
  return [...products].sort((a, b) => {
    const rateA = extractMaxRate(a.interestRate);
    const rateB = extractMaxRate(b.interestRate);
    return rateB - rateA;
  })[0];
}

function pickLowestRate(products: any[]): any | null {
  if (products.length === 0) return null;
  return [...products].sort((a, b) => {
    const rateA = extractMinRate(a.interestRate);
    const rateB = extractMinRate(b.interestRate);
    return rateA - rateB;
  })[0];
}

function extractMaxRate(rateStr: string | null): number {
  if (!rateStr) return 0;
  const matches = rateStr.match(/[\d.]+/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function extractMinRate(rateStr: string | null): number {
  if (!rateStr) return Infinity;
  const matches = rateStr.match(/[\d.]+/g);
  if (!matches) return Infinity;
  return Math.min(...matches.map(Number));
}

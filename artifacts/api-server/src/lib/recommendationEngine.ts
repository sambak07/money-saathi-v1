import { db, financialProductsTable } from "@workspace/db";
import type { FinancialSummary, ScoreBreakdown, BusinessScoreBreakdown, ProfileMode } from "./financialEngine";

export type RecommendationType =
  | "Best Fit"
  | "Better Rate but Higher Requirement"
  | "Safer Alternative"
  | "Improve Finances First";

export type ComparisonBasis =
  | "affordability"
  | "minimum balance"
  | "product fit"
  | "current financial risk"
  | "savings goal";

export interface AlternativeProduct {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  tradeoff: string;
  sourceUrl: string | null;
}

export interface ProductRecommendation {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  whyItFits: string;
  keyFeature: string;
  sourceUrl: string | null;
  lastUpdated: string;
  recommendationType: RecommendationType;
  reasons: string[];
  alternatives: AlternativeProduct[];
  comparisonBasis: ComparisonBasis;
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
      recommendations: [{
        id: 0,
        institutionName: "Financial Advisor",
        productName: "Debt Reduction Plan",
        productCategory: "advisory",
        whyItFits: `Your financial health score is ${totalScore}/100 with a debt ratio of ${Math.round(debtRatio * 100)}%. Before considering new financial products, focus on reducing your monthly debt payments below 30% of income (currently Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}/month).`,
        keyFeature: "Pay off high-interest loans first, avoid new borrowing, build a small emergency buffer",
        sourceUrl: null,
        lastUpdated: new Date().toISOString(),
        recommendationType: "Improve Finances First",
        reasons: [
          "debt ratio exceeds safe threshold",
          "health score too low for new products",
          "reducing debt improves all financial metrics",
        ],
        alternatives: [],
        comparisonBasis: "current financial risk",
      }],
      cautionMessage: `Your financial health score is ${totalScore}/100 with a debt ratio of ${Math.round(debtRatio * 100)}%. Before considering new financial products, focus on reducing your monthly debt payments below 30% of income (currently Nu. ${Math.round(summary.totalMonthlyObligations).toLocaleString()}/month). Pay off high-interest loans first, avoid new borrowing, and build a small emergency buffer. Visit the Financial Literacy Center for a step-by-step debt reduction plan.`,
    };
  }

  const savingsProducts = products.filter(p => p.productCategory === "savings");
  const fdProducts = products.filter(p => p.productCategory === "fd");
  const housingProducts = products.filter(p => p.productCategory === "housing");
  const personalProducts = products.filter(p => p.productCategory === "personal");
  const educationProducts = products.filter(p => p.productCategory === "education");

  const candidates: Array<ProductRecommendation & { priority: number }> = [];

  if (emergencyMonths < 3 && savingsProducts.length > 0) {
    const best = pickBestSavings(savingsProducts, "low_minimum");
    if (best) {
      const gap = Math.round(summary.totalMonthlyExpenses * (3 - emergencyMonths));
      const altSavings = savingsProducts.filter(p => p.id !== best.id);
      const betterRate = pickBestSavings(savingsProducts, "features");
      const alternatives: AlternativeProduct[] = [];

      if (betterRate && betterRate.id !== best.id) {
        alternatives.push({
          ...toAlternative(betterRate),
          tradeoff: "better interest rate but higher minimum balance",
        });
      }
      if (altSavings.length > 0 && alternatives.length < 2) {
        const alt = altSavings.find(p => p.id !== betterRate?.id);
        if (alt) {
          alternatives.push({
            ...toAlternative(alt),
            tradeoff: "stronger digital features but may require higher balance",
          });
        }
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your emergency fund covers only ${Math.round(emergencyMonths * 10) / 10} months of expenses. This savings account has a low minimum balance requirement, making it easy to start building your emergency reserve of Nu. ${gap.toLocaleString()}.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        recommendationType: "Best Fit",
        reasons: [
          "low minimum balance requirement",
          "suitable for emergency reserve building",
          "accessible funds when you need them",
        ],
        alternatives,
        comparisonBasis: "minimum balance",
        priority: 1,
      });
    }
  }

  if (savingsRatio < 0.3 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      const altFDs = fdProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];

      if (altFDs.length > 0) {
        const safer = [...altFDs].sort((a, b) => parseMinBalance(a.minimumBalance) - parseMinBalance(b.minimumBalance))[0];
        alternatives.push({
          ...toAlternative(safer),
          tradeoff: "lower minimum deposit but slightly lower rate",
        });
      }
      if (altFDs.length > 1) {
        const alt2 = altFDs.find(p => p.id !== alternatives[0]?.id);
        if (alt2) {
          alternatives.push({
            ...toAlternative(alt2),
            tradeoff: "flexible tenure options but rate varies",
          });
        }
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your savings are ${Math.round(savingsRatio * 100)}% of annual income — below the recommended 50%. A fixed deposit locks in guaranteed returns and builds disciplined saving habits. Start with a 1-year FD while you grow your savings base.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        recommendationType: emergencyMonths >= 3 ? "Best Fit" : "Better Rate but Higher Requirement",
        reasons: [
          "highest available interest rate",
          "guaranteed returns with no market risk",
          emergencyMonths < 3 ? "consider building emergency fund alongside" : "good for growing surplus savings",
        ],
        alternatives,
        comparisonBasis: "savings goal",
        priority: 2,
      });
    }
  }

  if (savingsRatio >= 0.5 && emergencyMonths >= 6 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      const altFDs = fdProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];
      if (altFDs.length > 0) {
        alternatives.push({
          ...toAlternative(altFDs[0]),
          tradeoff: "slightly lower rate but lower lock-in period",
        });
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your savings are strong at ${Math.round(savingsRatio * 100)}% of annual income with ${Math.round(emergencyMonths * 10) / 10} months of emergency coverage. A fixed deposit can grow your surplus funds at higher rates than a regular savings account.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        recommendationType: "Best Fit",
        reasons: [
          "strong financial position supports locking funds",
          "higher returns than regular savings",
          "good for long-term wealth building",
        ],
        alternatives,
        comparisonBasis: "product fit",
        priority: 4,
      });
    }
  }

  if (debtRatio < 0.3 && totalScore >= 45 && housingProducts.length > 0) {
    const maxEMI = income * 0.3 - summary.totalMonthlyObligations;
    if (maxEMI > 5000) {
      const best = pickLowestRate(housingProducts);
      if (best) {
        const altHousing = housingProducts.filter(p => p.id !== best.id);
        const alternatives: AlternativeProduct[] = [];
        if (altHousing.length > 0) {
          alternatives.push({
            ...toAlternative(altHousing[0]),
            tradeoff: "slightly higher rate but faster processing",
          });
        }
        if (altHousing.length > 1) {
          alternatives.push({
            ...toAlternative(altHousing[1]),
            tradeoff: "flexible tenure but higher fees",
          });
        }

        const isSafer = emergencyMonths >= 6 && debtRatio < 0.15;
        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Your debt ratio is a healthy ${Math.round(debtRatio * 100)}%, leaving room for Nu. ${Math.round(maxEMI).toLocaleString()}/month in EMI capacity. This housing loan offers competitive rates with a long tenure to keep monthly payments affordable.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | Tenure: ${best.tenure || "—"} | ${best.fees ? `Fee: ${best.fees}` : ""}`,
          recommendationType: isSafer ? "Best Fit" : "Safer Alternative",
          reasons: [
            "lowest available interest rate",
            `affordable based on current EMI capacity of Nu. ${Math.round(maxEMI).toLocaleString()}/mo`,
            isSafer ? "strong emergency buffer supports long-term commitment" : "ensure emergency fund is solid before committing",
          ],
          alternatives,
          comparisonBasis: "affordability",
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
    nonLoanCandidates.forEach(c => {
      c.recommendationType = "Safer Alternative";
      c.reasons = [
        "no additional debt risk",
        "helps build savings despite high obligations",
        "lower risk for current financial condition",
      ];
    });

    if (nonLoanCandidates.length === 0) {
      nonLoanCandidates.push({
        id: 0,
        institutionName: "Financial Advisor",
        productName: "Debt Reduction Strategy",
        productCategory: "advisory",
        whyItFits: `With ${Math.round(debtRatio * 100)}% of income going to debt, reducing obligations is the highest-impact move. Focus on paying off your highest-interest loans first.`,
        keyFeature: "Reduce debt-to-income below 30% before taking on new products",
        sourceUrl: null,
        lastUpdated: new Date().toISOString(),
        recommendationType: "Improve Finances First",
        reasons: [
          "debt ratio exceeds safe threshold",
          "reducing debt improves all financial metrics",
          "new products would increase financial risk",
        ],
        alternatives: [],
        comparisonBasis: "current financial risk",
        priority: 0,
      });
    }

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
        const altPersonal = personalProducts.filter(p => p.id !== best.id);
        const alternatives: AlternativeProduct[] = [];
        if (altPersonal.length > 0) {
          alternatives.push({
            ...toAlternative(altPersonal[0]),
            tradeoff: "higher rate but faster approval process",
          });
        }

        candidates.push({
          ...toRecommendation(best),
          whyItFits: `With a low debt ratio of ${Math.round(debtRatio * 100)}% and a health score of ${totalScore}/100, you have capacity for a personal loan EMI of up to Nu. ${Math.round(maxEMI).toLocaleString()}/month. This option offers competitive rates with flexible tenure.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | ${best.keyFeatures || ""}`,
          recommendationType: emergencyMonths >= 3 ? "Best Fit" : "Better Rate but Higher Requirement",
          reasons: [
            "lowest rate in category",
            `affordable based on current score of ${totalScore}/100`,
            emergencyMonths >= 3 ? "solid emergency fund supports new obligation" : "consider building emergency fund alongside",
          ],
          alternatives,
          comparisonBasis: "affordability",
          priority: 6,
        });
      }
    }
  }

  if (debtRatio < 0.2 && totalScore >= 50 && educationProducts.length > 0) {
    const best = pickLowestRate(educationProducts);
    if (best) {
      const altEdu = educationProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];
      if (altEdu.length > 0) {
        alternatives.push({
          ...toAlternative(altEdu[0]),
          tradeoff: "higher rate but more flexible repayment terms",
        });
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your financial health (${totalScore}/100) and low debt ratio (${Math.round(debtRatio * 100)}%) make education financing viable. Education loans often have deferred repayment, so they won't immediately impact your monthly budget.`,
        keyFeature: `Rate: ${best.interestRate || "—"} | Repayment: ${best.tenure || "—"}`,
        recommendationType: "Best Fit",
        reasons: [
          "lowest rate for education loans",
          "deferred repayment protects monthly budget",
          "low risk given current debt ratio",
        ],
        alternatives,
        comparisonBasis: "product fit",
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
      recommendations: [{
        id: 0,
        institutionName: "Financial Advisor",
        productName: "Business Stabilisation Plan",
        productCategory: "advisory",
        whyItFits: `Your business health score is ${totalScore}/100 with debt consuming ${Math.round(debtRatio * 100)}% of revenue. Stabilise operations before considering new products.`,
        keyFeature: "Reduce operating expenses, negotiate creditor terms, build 1-month cash reserve",
        sourceUrl: null,
        lastUpdated: new Date().toISOString(),
        recommendationType: "Improve Finances First",
        reasons: [
          "business debt exceeds safe revenue ratio",
          "score too low for sustainable new products",
          "stabilising operations is highest-impact action",
        ],
        alternatives: [],
        comparisonBasis: "current financial risk",
      }],
      cautionMessage: `Your business health score is ${totalScore}/100 with debt consuming ${Math.round(debtRatio * 100)}% of revenue. Before considering new financial products, stabilise operations: reduce operating expenses, negotiate better payment terms with creditors, and build a minimum 1-month cash reserve. Avoid new borrowing until the debt-to-revenue ratio drops below 30%.`,
    };
  }

  const savingsProducts = products.filter(p => p.productCategory === "savings");
  const fdProducts = products.filter(p => p.productCategory === "fd");
  const housingProducts = products.filter(p => p.productCategory === "housing");
  const personalProducts = products.filter(p => p.productCategory === "personal");

  const candidates: Array<ProductRecommendation & { priority: number }> = [];

  if (cashMonths < 3 && savingsProducts.length > 0) {
    const best = pickBestSavings(savingsProducts, "features");
    if (best) {
      const gap = Math.round(summary.totalMonthlyExpenses * (3 - cashMonths));
      const altSavings = savingsProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];
      if (altSavings.length > 0) {
        const lowMin = pickBestSavings(altSavings, "low_minimum");
        if (lowMin) {
          alternatives.push({
            ...toAlternative(lowMin),
            tradeoff: "lower minimum balance but fewer digital features",
          });
        }
      }
      if (altSavings.length > 1) {
        const alt2 = altSavings.find(p => p.id !== alternatives[0]?.id);
        if (alt2) {
          alternatives.push({
            ...toAlternative(alt2),
            tradeoff: "wider branch network but higher minimum balance",
          });
        }
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your business cash reserve covers only ${Math.round(cashMonths * 10) / 10} months of operating expenses — below the recommended 3 months. Open a dedicated business savings account to build an operating reserve of Nu. ${gap.toLocaleString()}.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        recommendationType: "Best Fit",
        reasons: [
          "suitable for business reserve building",
          "good digital banking features for operations",
          "accessible funds for business needs",
        ],
        alternatives,
        comparisonBasis: "minimum balance",
        priority: 1,
      });
    }
  }

  if (profitMargin >= 0.1 && cashMonths >= 2 && fdProducts.length > 0) {
    const best = pickBestFD(fdProducts);
    if (best) {
      const monthlySurplus = Math.round(revenue * profitMargin * 0.3);
      const altFDs = fdProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];
      if (altFDs.length > 0) {
        alternatives.push({
          ...toAlternative(altFDs[0]),
          tradeoff: "shorter lock-in period but lower return",
        });
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `With a ${Math.round(profitMargin * 100)}% profit margin and ${Math.round(cashMonths * 10) / 10} months of reserves, you can park surplus funds (roughly Nu. ${monthlySurplus.toLocaleString()}/month) in a fixed deposit for guaranteed returns while maintaining liquidity.`,
        keyFeature: `Rates: ${best.interestRate || "—"} | Min: ${best.minimumBalance || "—"}`,
        recommendationType: cashMonths >= 3 ? "Best Fit" : "Better Rate but Higher Requirement",
        reasons: [
          "highest available FD rate",
          "guaranteed returns on surplus revenue",
          cashMonths >= 3 ? "strong cash reserves support fund lock-in" : "ensure operating reserve is fully funded first",
        ],
        alternatives,
        comparisonBasis: "savings goal",
        priority: 3,
      });
    }
  }

  if (isHighDebt) {
    const cautionMsg = `Your business debt-to-revenue ratio is ${Math.round(debtRatio * 100)}% — above the safe threshold. New borrowing is not recommended. Focus on debt reduction and operational efficiency before considering loan products.`;
    const nonLoanCandidates = candidates.filter(c =>
      !["housing", "personal", "education"].includes(c.productCategory)
    );
    nonLoanCandidates.forEach(c => {
      c.recommendationType = "Safer Alternative";
      c.reasons = [
        "no additional debt burden",
        "helps stabilise business finances",
        "lower risk for current financial position",
      ];
    });

    if (nonLoanCandidates.length === 0) {
      nonLoanCandidates.push({
        id: 0,
        institutionName: "Financial Advisor",
        productName: "Debt Reduction Strategy",
        productCategory: "advisory",
        whyItFits: `With ${Math.round(debtRatio * 100)}% of revenue going to debt, reducing obligations should be the priority before any new financial commitments.`,
        keyFeature: "Target debt-to-revenue below 30% for sustainable growth",
        sourceUrl: null,
        lastUpdated: new Date().toISOString(),
        recommendationType: "Improve Finances First",
        reasons: [
          "business debt exceeds safe threshold",
          "reducing debt frees up working capital",
          "new products would increase business risk",
        ],
        alternatives: [],
        comparisonBasis: "current financial risk",
        priority: 0,
      });
    }

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
        const altPersonal = personalProducts.filter(p => p.id !== best.id);
        const alternatives: AlternativeProduct[] = [];
        if (altPersonal.length > 0) {
          alternatives.push({
            ...toAlternative(altPersonal[0]),
            tradeoff: "higher rate but faster disbursement",
          });
        }

        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Your business has a healthy ${Math.round(profitMargin * 100)}% profit margin and low debt ratio (${Math.round(debtRatio * 100)}%). You can afford additional EMI of up to Nu. ${Math.round(maxEMI).toLocaleString()}/month for working capital or expansion needs.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | ${best.keyFeatures || ""}`,
          recommendationType: cashMonths >= 3 ? "Best Fit" : "Better Rate but Higher Requirement",
          reasons: [
            "lowest rate available for working capital",
            `affordable based on Nu. ${Math.round(maxEMI).toLocaleString()}/mo EMI capacity`,
            cashMonths >= 3 ? "strong cash reserves support new obligation" : "ensure cash reserves are adequate first",
          ],
          alternatives,
          comparisonBasis: "affordability",
          priority: 5,
        });
      }
    }

    if (maxEMI > 15000 && housingProducts.length > 0) {
      const best = pickLowestRate(housingProducts);
      if (best) {
        const altHousing = housingProducts.filter(p => p.id !== best.id);
        const alternatives: AlternativeProduct[] = [];
        if (altHousing.length > 0) {
          alternatives.push({
            ...toAlternative(altHousing[0]),
            tradeoff: "higher rate but more flexible terms",
          });
        }

        candidates.push({
          ...toRecommendation(best),
          whyItFits: `Strong business performance (score: ${totalScore}/100, profit margin: ${Math.round(profitMargin * 100)}%) supports property investment. A commercial property loan could help your business own rather than rent premises, building long-term equity.`,
          keyFeature: `Rate: ${best.interestRate || "—"} | Tenure: ${best.tenure || "—"}`,
          recommendationType: "Best Fit",
          reasons: [
            "competitive rate for commercial property",
            "business performance supports long-term commitment",
            "builds business equity over renting",
          ],
          alternatives,
          comparisonBasis: "affordability",
          priority: 6,
        });
      }
    }
  }

  if (profitMargin < 0 && savingsProducts.length > 0 && candidates.length === 0) {
    const best = pickBestSavings(savingsProducts, "low_minimum");
    if (best) {
      const altSavings = savingsProducts.filter(p => p.id !== best.id);
      const alternatives: AlternativeProduct[] = [];
      if (altSavings.length > 0) {
        alternatives.push({
          ...toAlternative(altSavings[0]),
          tradeoff: "better features but higher minimum balance requirement",
        });
      }

      candidates.push({
        ...toRecommendation(best),
        whyItFits: `Your business is currently operating at a loss. Before any other financial product, the priority is to build a cash buffer. Start with a simple savings account to set aside any available funds as a safety net.`,
        keyFeature: `Min balance: ${best.minimumBalance || "—"} | Rate: ${best.interestRate || "—"}`,
        recommendationType: "Safer Alternative",
        reasons: [
          "lowest barrier to entry",
          "builds essential cash buffer during losses",
          "no lock-in preserves liquidity",
        ],
        alternatives,
        comparisonBasis: "current financial risk",
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
    recommendationType: "Best Fit",
    reasons: [],
    alternatives: [],
    comparisonBasis: "product fit",
  };
}

function toAlternative(product: any): AlternativeProduct {
  return {
    id: product.id,
    institutionName: product.institutionName,
    productName: product.productName,
    productCategory: product.productCategory,
    tradeoff: "",
    sourceUrl: product.sourceUrl,
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

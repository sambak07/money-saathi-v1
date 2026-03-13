import { db, financialProductsTable } from "@workspace/db";

const SEED_DATA = [
  { institutionName: "Bank of Bhutan (BOB)", productCategory: "savings", productName: "Savings Account", interestRate: "4.00%", minimumBalance: "Nu. 500", keyFeatures: "Largest branch network, mobile banking" },
  { institutionName: "Bhutan National Bank (BNB)", productCategory: "savings", productName: "Savings Account", interestRate: "4.25%", minimumBalance: "Nu. 1,000", keyFeatures: "Digital banking, SMS alerts" },
  { institutionName: "Bhutan Development Bank (BDB)", productCategory: "savings", productName: "Savings Account", interestRate: "4.00%", minimumBalance: "Nu. 500", keyFeatures: "Rural focus, agricultural lending" },
  { institutionName: "T Bank", productCategory: "savings", productName: "Savings Account", interestRate: "4.50%", minimumBalance: "Nu. 1,000", keyFeatures: "Modern digital services" },
  { institutionName: "Druk PNB", productCategory: "savings", productName: "Savings Account", interestRate: "4.00%", minimumBalance: "Nu. 1,000", keyFeatures: "Joint venture, savings products" },

  { institutionName: "Bank of Bhutan", productCategory: "fd", productName: "Fixed Deposit", interestRate: "7.00% (1yr), 7.50% (2yr), 8.00% (3yr), 8.50% (5yr)", minimumBalance: "Nu. 5,000", keyFeatures: "Government-backed, reliable returns" },
  { institutionName: "Bhutan National Bank", productCategory: "fd", productName: "Fixed Deposit", interestRate: "7.25% (1yr), 7.75% (2yr), 8.25% (3yr), 8.75% (5yr)", minimumBalance: "Nu. 5,000", keyFeatures: "Competitive rates, digital access" },
  { institutionName: "Bhutan Development Bank", productCategory: "fd", productName: "Fixed Deposit", interestRate: "6.75% (1yr), 7.25% (2yr), 7.75% (3yr), 8.25% (5yr)", minimumBalance: "Nu. 1,000", keyFeatures: "Low minimum deposit, rural accessibility" },
  { institutionName: "T Bank", productCategory: "fd", productName: "Fixed Deposit", interestRate: "7.50% (1yr), 8.00% (2yr), 8.50% (3yr), 9.00% (5yr)", minimumBalance: "Nu. 10,000", keyFeatures: "Highest rates, modern banking" },
  { institutionName: "Druk PNB", productCategory: "fd", productName: "Fixed Deposit", interestRate: "7.00% (1yr), 7.50% (2yr), 8.00% (3yr), 8.50% (5yr)", minimumBalance: "Nu. 5,000", keyFeatures: "International banking standards" },

  { institutionName: "Bank of Bhutan", productCategory: "housing", productName: "Housing Loan", interestRate: "9.00% – 10.50%", tenure: "20 years", fees: "1% of loan", keyFeatures: "Max LTV 80%, largest housing lender" },
  { institutionName: "Bhutan National Bank", productCategory: "housing", productName: "Housing Loan", interestRate: "9.25% – 10.75%", tenure: "20 years", fees: "1% of loan", keyFeatures: "Max LTV 80%, quick processing" },
  { institutionName: "Bhutan Development Bank", productCategory: "housing", productName: "Housing Loan", interestRate: "8.75% – 10.25%", tenure: "25 years", fees: "0.75% of loan", keyFeatures: "Max LTV 85%, lowest processing fee" },
  { institutionName: "NPPF", productCategory: "housing", productName: "Housing Loan", interestRate: "8.00% – 9.00%", tenure: "25 years", fees: "Minimal", keyFeatures: "Max LTV 90%, best rates for NPPF members" },
  { institutionName: "T Bank", productCategory: "housing", productName: "Housing Loan", interestRate: "9.50% – 11.00%", tenure: "15 years", fees: "1% of loan", keyFeatures: "Max LTV 75%, quick disbursal" },

  { institutionName: "Bank of Bhutan", productCategory: "personal", productName: "Personal Loan", interestRate: "12.00% – 14.00%", tenure: "5 years", keyFeatures: "Max Nu. 5,00,000, salary assignment collateral" },
  { institutionName: "Bhutan National Bank", productCategory: "personal", productName: "Personal Loan", interestRate: "12.50% – 14.50%", tenure: "5 years", keyFeatures: "Max Nu. 5,00,000, salary assignment collateral" },
  { institutionName: "Bhutan Development Bank", productCategory: "personal", productName: "Personal Loan", interestRate: "11.00% – 13.00%", tenure: "5 years", keyFeatures: "Max Nu. 3,00,000, guarantor collateral" },
  { institutionName: "T Bank", productCategory: "personal", productName: "Personal Loan", interestRate: "13.00% – 15.00%", tenure: "4 years", keyFeatures: "Max Nu. 4,00,000, salary assignment collateral" },
  { institutionName: "Druk PNB", productCategory: "personal", productName: "Personal Loan", interestRate: "12.00% – 14.00%", tenure: "5 years", keyFeatures: "Max Nu. 5,00,000, property/salary collateral" },

  { institutionName: "Bank of Bhutan", productCategory: "education", productName: "Education Loan", interestRate: "8.00% – 10.00%", tenure: "Repayment after course + 6 months", keyFeatures: "Max Nu. 10,00,000, parent guarantee" },
  { institutionName: "Bhutan National Bank", productCategory: "education", productName: "Education Loan", interestRate: "8.50% – 10.50%", tenure: "Repayment after course + 1 year", keyFeatures: "Max Nu. 8,00,000, parent guarantee" },
  { institutionName: "Bhutan Development Bank", productCategory: "education", productName: "Education Loan", interestRate: "7.50% – 9.50%", tenure: "Repayment after course + 1 year", keyFeatures: "Max Nu. 12,00,000, parent/property collateral" },
  { institutionName: "Royal Government Scholarship", productCategory: "education", productName: "Education Grant", interestRate: "0% (Grant)", tenure: "Service bond", keyFeatures: "Full tuition, no collateral required" },
];

export async function seedFinancialProducts() {
  const existing = await db.select({ id: financialProductsTable.id }).from(financialProductsTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(financialProductsTable).values(
    SEED_DATA.map(d => ({
      ...d,
      lastUpdated: new Date(),
    }))
  );
  console.log(`Seeded ${SEED_DATA.length} financial products`);
}

import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { Building2, Percent, Clock, ArrowUpDown } from "lucide-react";

type TabKey = "savings" | "fd" | "housing" | "personal" | "education";

const TABS: { key: TabKey; label: string }[] = [
  { key: "savings", label: "Savings Accounts" },
  { key: "fd", label: "Fixed Deposits" },
  { key: "housing", label: "Housing Loans" },
  { key: "personal", label: "Personal Loans" },
  { key: "education", label: "Education Loans" },
];

const SAVINGS_DATA = [
  { bank: "Bank of Bhutan (BOB)", minBalance: "Nu. 500", interestRate: "4.00%", features: "Largest branch network, mobile banking" },
  { bank: "Bhutan National Bank (BNB)", minBalance: "Nu. 1,000", interestRate: "4.25%", features: "Digital banking, SMS alerts" },
  { bank: "Bhutan Development Bank (BDB)", minBalance: "Nu. 500", interestRate: "4.00%", features: "Rural focus, agricultural lending" },
  { bank: "T Bank", minBalance: "Nu. 1,000", interestRate: "4.50%", features: "Modern digital services" },
  { bank: "Druk PNB", minBalance: "Nu. 1,000", interestRate: "4.00%", features: "Joint venture, savings products" },
];

const FD_DATA = [
  { bank: "Bank of Bhutan", "1yr": "7.00%", "2yr": "7.50%", "3yr": "8.00%", "5yr": "8.50%", minDeposit: "Nu. 5,000" },
  { bank: "Bhutan National Bank", "1yr": "7.25%", "2yr": "7.75%", "3yr": "8.25%", "5yr": "8.75%", minDeposit: "Nu. 5,000" },
  { bank: "Bhutan Development Bank", "1yr": "6.75%", "2yr": "7.25%", "3yr": "7.75%", "5yr": "8.25%", minDeposit: "Nu. 1,000" },
  { bank: "T Bank", "1yr": "7.50%", "2yr": "8.00%", "3yr": "8.50%", "5yr": "9.00%", minDeposit: "Nu. 10,000" },
  { bank: "Druk PNB", "1yr": "7.00%", "2yr": "7.50%", "3yr": "8.00%", "5yr": "8.50%", minDeposit: "Nu. 5,000" },
];

const HOUSING_DATA = [
  { bank: "Bank of Bhutan", rate: "9.00% – 10.50%", maxTenure: "20 years", maxLTV: "80%", processing: "1% of loan" },
  { bank: "Bhutan National Bank", rate: "9.25% – 10.75%", maxTenure: "20 years", maxLTV: "80%", processing: "1% of loan" },
  { bank: "Bhutan Development Bank", rate: "8.75% – 10.25%", maxTenure: "25 years", maxLTV: "85%", processing: "0.75% of loan" },
  { bank: "NPPF Housing Loan", rate: "8.00% – 9.00%", maxTenure: "25 years", maxLTV: "90%", processing: "Minimal" },
  { bank: "T Bank", rate: "9.50% – 11.00%", maxTenure: "15 years", maxLTV: "75%", processing: "1% of loan" },
];

const PERSONAL_DATA = [
  { bank: "Bank of Bhutan", rate: "12.00% – 14.00%", maxAmount: "Nu. 5,00,000", maxTenure: "5 years", collateral: "Salary assignment" },
  { bank: "Bhutan National Bank", rate: "12.50% – 14.50%", maxAmount: "Nu. 5,00,000", maxTenure: "5 years", collateral: "Salary assignment" },
  { bank: "Bhutan Development Bank", rate: "11.00% – 13.00%", maxAmount: "Nu. 3,00,000", maxTenure: "5 years", collateral: "Guarantor" },
  { bank: "T Bank", rate: "13.00% – 15.00%", maxAmount: "Nu. 4,00,000", maxTenure: "4 years", collateral: "Salary assignment" },
  { bank: "Druk PNB", rate: "12.00% – 14.00%", maxAmount: "Nu. 5,00,000", maxTenure: "5 years", collateral: "Property / Salary" },
];

const EDUCATION_DATA = [
  { bank: "Bank of Bhutan", rate: "8.00% – 10.00%", maxAmount: "Nu. 10,00,000", repayment: "After course + 6 months", collateral: "Parent guarantee" },
  { bank: "Bhutan National Bank", rate: "8.50% – 10.50%", maxAmount: "Nu. 8,00,000", repayment: "After course + 1 year", collateral: "Parent guarantee" },
  { bank: "Bhutan Development Bank", rate: "7.50% – 9.50%", maxAmount: "Nu. 12,00,000", repayment: "After course + 1 year", collateral: "Parent / Property" },
  { bank: "Royal Government Scholarship", rate: "0% (Grant)", maxAmount: "Full tuition", repayment: "Service bond", collateral: "None" },
];

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">{children}</th>;
}

function Td({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return <td className={`px-4 py-3 border-b border-border/30 ${highlight ? "font-bold text-primary" : ""}`}>{children}</td>;
}

function SavingsTable() {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Min Balance</Th><Th>Interest Rate</Th><Th>Features</Th></tr></thead>
      <tbody>
        {SAVINGS_DATA.map(row => (
          <tr key={row.bank} className="hover:bg-muted/10 transition-colors">
            <Td><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold">{row.bank}</span></div></Td>
            <Td>{row.minBalance}</Td>
            <Td highlight>{row.interestRate}</Td>
            <Td><span className="text-muted-foreground">{row.features}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function FDTable() {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>1 Year</Th><Th>2 Years</Th><Th>3 Years</Th><Th>5 Years</Th><Th>Min Deposit</Th></tr></thead>
      <tbody>
        {FD_DATA.map(row => (
          <tr key={row.bank} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{row.bank}</span></Td>
            <Td>{row["1yr"]}</Td>
            <Td>{row["2yr"]}</Td>
            <Td>{row["3yr"]}</Td>
            <Td highlight>{row["5yr"]}</Td>
            <Td>{row.minDeposit}</Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function HousingTable() {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Interest Rate</Th><Th>Max Tenure</Th><Th>Max LTV</Th><Th>Processing Fee</Th></tr></thead>
      <tbody>
        {HOUSING_DATA.map(row => (
          <tr key={row.bank} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{row.bank}</span></Td>
            <Td highlight>{row.rate}</Td>
            <Td>{row.maxTenure}</Td>
            <Td>{row.maxLTV}</Td>
            <Td><span className="text-muted-foreground">{row.processing}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function PersonalTable() {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Interest Rate</Th><Th>Max Amount</Th><Th>Max Tenure</Th><Th>Collateral</Th></tr></thead>
      <tbody>
        {PERSONAL_DATA.map(row => (
          <tr key={row.bank} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{row.bank}</span></Td>
            <Td highlight>{row.rate}</Td>
            <Td>{row.maxAmount}</Td>
            <Td>{row.maxTenure}</Td>
            <Td><span className="text-muted-foreground">{row.collateral}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function EducationTable() {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Interest Rate</Th><Th>Max Amount</Th><Th>Repayment</Th><Th>Collateral</Th></tr></thead>
      <tbody>
        {EDUCATION_DATA.map(row => (
          <tr key={row.bank} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{row.bank}</span></Td>
            <Td highlight>{row.rate}</Td>
            <Td>{row.maxAmount}</Td>
            <Td>{row.repayment}</Td>
            <Td><span className="text-muted-foreground">{row.collateral}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

const TABLE_MAP: Record<TabKey, () => JSX.Element> = {
  savings: SavingsTable,
  fd: FDTable,
  housing: HousingTable,
  personal: PersonalTable,
  education: EducationTable,
};

const DESCRIPTIONS: Record<TabKey, string> = {
  savings: "Compare savings account interest rates and minimum balance requirements across Bhutan's major banks.",
  fd: "Fixed deposit rates for various tenures — lock in your savings at the best rates available.",
  housing: "Housing loan rates, tenure limits, and loan-to-value ratios from Bhutan's lending institutions.",
  personal: "Personal loan options for salaried and self-employed individuals across Bhutan's banks.",
  education: "Education loan programs to fund higher studies, including government scholarship options.",
};

export default function BankComparison() {
  const [activeTab, setActiveTab] = useState<TabKey>("savings");
  const TableComponent = TABLE_MAP[activeTab];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Bank Product Comparison</h1>
          <p className="text-muted-foreground mt-1">Compare financial products across Bhutan's banks to find the best fit for your needs.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-4">{DESCRIPTIONS[activeTab]}</p>
          <TableComponent />
          <p className="text-xs text-muted-foreground mt-4 italic">
            Rates are indicative and subject to change. Please confirm with the respective bank for current rates and terms.
          </p>
        </Card>
      </div>
    </Layout>
  );
}

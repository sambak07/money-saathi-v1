import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { Building2, Clock, Loader2 } from "lucide-react";

type TabKey = "savings" | "fd" | "housing" | "personal" | "education";

const TABS: { key: TabKey; label: string }[] = [
  { key: "savings", label: "Savings Accounts" },
  { key: "fd", label: "Fixed Deposits" },
  { key: "housing", label: "Housing Loans" },
  { key: "personal", label: "Personal Loans" },
  { key: "education", label: "Education Loans" },
];

const DESCRIPTIONS: Record<TabKey, string> = {
  savings: "Compare savings account interest rates and minimum balance requirements across Bhutan's major banks.",
  fd: "Fixed deposit rates for various tenures — lock in your savings at the best rates available.",
  housing: "Housing loan rates, tenure limits, and loan-to-value ratios from Bhutan's lending institutions.",
  personal: "Personal loan options for salaried and self-employed individuals across Bhutan's banks.",
  education: "Education loan programs to fund higher studies, including government scholarship options.",
};

interface Product {
  id: number;
  institutionName: string;
  productCategory: string;
  productName: string;
  interestRate: string | null;
  minimumBalance: string | null;
  tenure: string | null;
  fees: string | null;
  keyFeatures: string | null;
  sourceUrl: string | null;
  lastUpdated: string;
}

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

function SavingsTable({ products }: { products: Product[] }) {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Min Balance</Th><Th>Interest Rate</Th><Th>Features</Th></tr></thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
            <Td><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold">{p.institutionName}</span></div></Td>
            <Td>{p.minimumBalance || "—"}</Td>
            <Td highlight>{p.interestRate || "—"}</Td>
            <Td><span className="text-muted-foreground">{p.keyFeatures || "—"}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function FDTable({ products }: { products: Product[] }) {
  return (
    <TableWrapper>
      <thead><tr><Th>Bank</Th><Th>Interest Rates</Th><Th>Min Deposit</Th><Th>Features</Th></tr></thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{p.institutionName}</span></Td>
            <Td highlight>{p.interestRate || "—"}</Td>
            <Td>{p.minimumBalance || "—"}</Td>
            <Td><span className="text-muted-foreground">{p.keyFeatures || "—"}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

function LoanTable({ products, showFees }: { products: Product[]; showFees?: boolean }) {
  return (
    <TableWrapper>
      <thead>
        <tr>
          <Th>Bank</Th>
          <Th>Interest Rate</Th>
          <Th>Tenure</Th>
          {showFees && <Th>Processing Fee</Th>}
          <Th>Details</Th>
        </tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
            <Td><span className="font-semibold">{p.institutionName}</span></Td>
            <Td highlight>{p.interestRate || "—"}</Td>
            <Td>{p.tenure || "—"}</Td>
            {showFees && <Td><span className="text-muted-foreground">{p.fees || "—"}</span></Td>}
            <Td><span className="text-muted-foreground">{p.keyFeatures || "—"}</span></Td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  );
}

export default function BankComparison() {
  const [activeTab, setActiveTab] = useState<TabKey>("savings");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/financial-products", { credentials: "include" })
      .then(res => res.ok ? res.json() : [])
      .then(data => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => p.productCategory === activeTab);

  const lastUpdated = filtered.length > 0
    ? filtered.reduce((latest, p) => {
        const d = new Date(p.lastUpdated);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No products available in this category yet.
        </div>
      );
    }
    switch (activeTab) {
      case "savings": return <SavingsTable products={filtered} />;
      case "fd": return <FDTable products={filtered} />;
      case "housing": return <LoanTable products={filtered} showFees />;
      case "personal": return <LoanTable products={filtered} />;
      case "education": return <LoanTable products={filtered} />;
    }
  };

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
          {renderTable()}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground italic">
              Rates are indicative and subject to change. Please confirm with the respective bank for current rates and terms.
            </p>
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated: {lastUpdated.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

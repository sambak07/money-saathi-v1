import { useGetReports } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { FileText, TrendingUp, TrendingDown, Calendar, Lightbulb, PiggyBank, Receipt, Landmark, AlertTriangle, CheckCircle2, CircleAlert, ArrowRight, Wallet, Plus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  Excellent:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  Strong:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  Moderate:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: CircleAlert },
  Risk:       { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  icon: AlertTriangle },
  Critical:   { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: AlertTriangle },
};

function ReportVerdict({ score, category, mainRisk, nextBestAction }: {
  score: number; category: string; mainRisk: string; nextBestAction: string;
}) {
  const style = VERDICT_COLORS[category] || VERDICT_COLORS.Moderate;
  const VerdictIcon = style.icon;

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4`}>
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}>
          <span className={`text-xl font-display font-bold ${style.text}`}>{Math.round(score)}</span>
        </div>
        <div>
          <Badge variant={score >= 60 ? "success" : score >= 40 ? "warning" : "destructive"} className="text-[10px]">
            {category}
          </Badge>
        </div>
      </div>
      <div className="flex-1 grid sm:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Main Risk</p>
          <div className="flex items-center gap-1.5">
            <VerdictIcon className={`w-3.5 h-3.5 ${style.text} shrink-0`} />
            <p className={`text-sm font-semibold ${style.text}`}>{mainRisk}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Next Action</p>
          <p className="text-sm font-medium text-foreground">{nextBestAction}</p>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: any }) {
  const date = new Date(report.year, report.month - 1);
  const netPositive = report.netSavings >= 0;
  const score = Math.round(report.financialScore);
  const debtToIncome = report.totalIncome > 0 ? Math.round((report.totalDebt / report.totalIncome) * 100) : 0;
  const verdict = report.verdict || { mainRisk: "—", nextBestAction: "—" };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">{format(date, 'MMMM yyyy')}</h2>
            <p className="text-xs text-muted-foreground">Generated {format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <ReportVerdict
          score={score}
          category={report.scoreCategory}
          mainRisk={verdict.mainRisk}
          nextBestAction={verdict.nextBestAction}
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0"><PiggyBank className="w-4 h-4 text-emerald-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Income</p>
              {report.totalIncome > 0 ? (
                <p className="text-lg font-bold">{formatNu(report.totalIncome)}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Not recorded — add income sources for an accurate report.</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg shrink-0"><Receipt className="w-4 h-4 text-red-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Expenses</p>
              {report.totalExpenses > 0 ? (
                <p className="text-lg font-bold">{formatNu(report.totalExpenses)}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Not recorded — add monthly expenses for a complete picture.</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              {netPositive ? <TrendingUp className="w-4 h-4 text-primary" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Net Savings</p>
              <p className={`text-lg font-bold ${netPositive ? "text-emerald-600" : "text-red-600"}`}>
                {netPositive ? "" : "−"}{formatNu(Math.abs(report.netSavings))}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg shrink-0"><Landmark className="w-4 h-4 text-amber-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Debt Burden</p>
              {report.totalDebt > 0 ? (
                <>
                  <p className="text-lg font-bold">{formatNu(report.totalDebt)}</p>
                  <p className="text-[10px] text-muted-foreground">{debtToIncome}% of income</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">None recorded — add any EMIs or loans if applicable.</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><PiggyBank className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Savings</p>
              {report.totalSavings > 0 ? (
                <p className="text-lg font-bold">{formatNu(report.totalSavings)}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Not recorded — add savings balances to track your reserve.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Reports() {
  const { data: reports, isLoading } = useGetReports();
  const { generateReport } = useFinanceMutations();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleGenerate = () => {
    generateReport.mutate(undefined as any);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Monthly Reports</h1>
          <p className="text-muted-foreground mt-1">Your monthly financial summary at a glance.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generateReport.isPending} className="gap-2 shrink-0">
          <FileText className="w-4 h-4" />
          {generateReport.isPending ? "Generating..." : "Generate This Month"}
        </Button>
      </div>

      {!reports || reports.length === 0 ? (
        <Card className="p-10 border-dashed border-2 bg-transparent">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="p-4 bg-primary/10 rounded-2xl mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Reports Yet</h2>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              Monthly reports capture a snapshot of your finances — income, expenses, savings, debt, health score, and a recommended action.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              For the most useful report, first <Link href="/data-entry" className="text-primary font-semibold hover:underline">enter your financial data</Link>, then generate your first report.
            </p>
            <Button onClick={handleGenerate} disabled={generateReport.isPending} className="gap-2">
              <Plus className="w-4 h-4" /> Generate First Report
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </Layout>
  );
}

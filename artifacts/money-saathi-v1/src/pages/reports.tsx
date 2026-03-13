import { useGetReports } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { FileText, TrendingUp, TrendingDown, Calendar, Lightbulb, PiggyBank, Receipt, Landmark, Activity } from "lucide-react";
import { format } from "date-fns";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 60) return "bg-primary/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function ReportCard({ report }: { report: any }) {
  const date = new Date(report.year, report.month - 1);
  const netPositive = report.netSavings >= 0;
  const score = Math.round(report.financialScore);
  const debtToIncome = report.totalIncome > 0 ? Math.round((report.totalDebt / report.totalIncome) * 100) : 0;

  const topAction = report.recommendations?.[0] || null;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{format(date, 'MMMM yyyy')}</h2>
            <p className="text-xs text-muted-foreground">Generated {format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${getScoreBg(score)}`}>
          <Activity className={`w-4 h-4 ${getScoreColor(score)}`} />
          <span className={`font-display font-bold text-lg ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
          <Badge variant={score >= 60 ? "success" : score >= 40 ? "warning" : "destructive"} className="ml-1 text-[10px]">
            {report.scoreCategory}
          </Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0"><PiggyBank className="w-4 h-4 text-emerald-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Income</p>
              <p className="text-lg font-bold">{formatNu(report.totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg shrink-0"><Receipt className="w-4 h-4 text-red-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Expenses</p>
              <p className="text-lg font-bold">{formatNu(report.totalExpenses)}</p>
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
              <p className="text-lg font-bold">{formatNu(report.totalDebt)}</p>
              <p className="text-[10px] text-muted-foreground">{debtToIncome}% of income</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><PiggyBank className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Savings Balance</p>
              <p className="text-lg font-bold">{formatNu(report.totalSavings)}</p>
            </div>
          </div>
        </div>

        {topAction && (
          <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3 border border-primary/10">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Recommended Action</p>
              <p className="text-sm font-semibold text-foreground">{topAction}</p>
            </div>
          </div>
        )}
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
    generateReport.mutate({});
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
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 bg-transparent">
          <FileText className="w-14 h-14 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Reports Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Generate your first monthly report to capture a snapshot of your finances and track your progress over time.
          </p>
          <Button onClick={handleGenerate} disabled={generateReport.isPending}>
            Generate First Report
          </Button>
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

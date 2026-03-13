import { useGetReports } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { FileText, Download, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Monthly Reports</h1>
          <p className="text-muted-foreground mt-1">Review your historical financial performance and insights.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generateReport.isPending} className="gap-2">
          <FileText className="w-4 h-4" /> 
          {generateReport.isPending ? "Generating..." : "Generate Current Month"}
        </Button>
      </div>

      {!reports || reports.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 bg-transparent">
          <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Reports Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Generate your first monthly report to snapshot your financial health, save historical data, and track your progress over time.
          </p>
          <Button onClick={handleGenerate} disabled={generateReport.isPending}>
            Generate First Report
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => {
            const date = new Date(report.year, report.month - 1);
            return (
              <Card key={report.id} className="p-0 overflow-hidden">
                <div className="bg-accent/30 border-b border-border/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{format(date, 'MMMM yyyy')}</h2>
                      <p className="text-sm text-muted-foreground">Generated on {format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-muted-foreground">Health Score</div>
                      <div className="font-display font-bold text-lg text-primary">{Math.round(report.financialScore)}/100</div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" /> PDF
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 grid sm:grid-cols-2 md:grid-cols-4 gap-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Income</div>
                    <div className="font-bold text-lg">{formatNu(report.totalIncome)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Expenses</div>
                    <div className="font-bold text-lg text-red-600">{formatNu(report.totalExpenses)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Net Savings</div>
                    <div className="font-bold text-lg text-primary">{formatNu(report.netSavings)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Debt</div>
                    <div className="font-bold text-lg">{formatNu(report.totalDebt)}</div>
                  </div>
                </div>

                {report.recommendations && report.recommendations.length > 0 && (
                  <div className="p-6 bg-background">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" /> Key Takeaways
                    </h4>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

import { useGetFinancialScore } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, cn, InfoTooltip } from "@/components/ui-elements";
import { RefreshCw, Info, Building2, User, Plus, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Score() {
  const { data: score, isLoading } = useGetFinancialScore();
  const { calculateScore } = useFinanceMutations();
  const { user } = useAuth();
  const isBusiness = user?.profileType === "small_business";

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleRecalculate = () => {
    calculateScore.mutate(undefined as any);
  };

  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-500 bg-emerald-500";
    if (val >= 60) return "text-primary bg-primary";
    if (val >= 40) return "text-amber-500 bg-amber-500";
    return "text-red-500 bg-red-500";
  };

  const getTextColor = (val: number) => {
    if (val >= 80) return "text-emerald-600";
    if (val >= 60) return "text-primary";
    if (val >= 40) return "text-amber-600";
    return "text-red-600";
  };

  if (!score) {
    return (
      <Layout>
        <Card className="p-10 border-dashed border-2 bg-transparent max-w-xl mx-auto mt-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-primary/10 rounded-2xl mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Score Calculated Yet</h2>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              Your financial health score measures your overall financial resilience on a 0–100 scale across four key areas.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              For the most accurate score, first <Link href="/data-entry" className="text-primary font-semibold hover:underline">enter your financial data</Link> (income, expenses, savings, and loans), then calculate your score.
            </p>
            <div className="flex gap-3">
              <Link href="/data-entry">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Data First
                </Button>
              </Link>
              <Button onClick={handleRecalculate} disabled={calculateScore.isPending} className="gap-2">
                <RefreshCw className={cn("w-4 h-4", calculateScore.isPending && "animate-spin")} />
                Calculate Score
              </Button>
            </div>
          </div>
        </Card>
      </Layout>
    );
  }

  const individualComponents = [
    { title: "Savings Habit", score: score.savingsScore, ratio: score.savingsRatio, desc: "Portion of income saved monthly.", tooltip: "Compares your total savings to annual income. Target: savings equal to 50% or more of annual income for full marks.", isMonths: false },
    { title: "Debt Burden", score: score.debtScore, ratio: score.debtRatio, desc: "Income dedicated to debt repayment.", tooltip: "Monthly loan/EMI payments as a percentage of income. Below 20% earns full marks; above 50% is a red flag.", isMonths: false },
    { title: "Emergency Fund", score: score.emergencyScore, ratio: score.emergencyFundCoverage, desc: "Months of expenses covered by savings.", tooltip: "How many months of expenses your emergency savings can cover. 6+ months earns full marks.", isMonths: true },
    { title: "Expense Management", score: score.expenseScore, ratio: score.expenseRatio, desc: "Portion of income spent on living costs.", tooltip: "Monthly expenses as a percentage of income. Spending 50% or less earns full marks; above 90% is critical.", isMonths: false },
  ];

  const businessComponents = [
    { title: "Profit Margin", score: (score as any).profitScore || score.savingsScore, ratio: (score as any).profitMargin || score.savingsRatio, desc: "Net profit as % of revenue.", tooltip: "Net profit (revenue − expenses − debt) divided by revenue. 20%+ earns full marks.", isMonths: false },
    { title: "Debt-to-Revenue", score: score.debtScore, ratio: score.debtRatio, desc: "Monthly loan payments vs revenue.", tooltip: "Monthly business loan payments as a percentage of revenue. Below 20% earns full marks.", isMonths: false },
    { title: "Cash Reserve", score: (score as any).cashReserveScore || score.emergencyScore, ratio: (score as any).cashReserveMonths || score.emergencyFundCoverage, desc: "Months of operating expenses covered.", tooltip: "How many months of operating expenses your cash balance covers. 3+ months earns full marks.", isMonths: true },
    { title: "Revenue Stability", score: (score as any).revenueStabilityScore || score.expenseScore, ratio: (score as any).revenueStabilityRatio || score.expenseRatio, desc: "Consistency and reliability of income.", tooltip: "Based on number of income sources and revenue concentration. 3+ diversified sources earns full marks.", isMonths: false },
  ];

  const components = isBusiness ? businessComponents : individualComponents;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isBusiness ? "Business Health Score" : "Health Score Breakdown"}
            </h1>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${isBusiness ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
              {isBusiness ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isBusiness ? "Business" : "Individual"}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Last updated: {format(new Date(score.calculatedAt), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <Button onClick={handleRecalculate} disabled={calculateScore.isPending} variant="outline" className="gap-2">
          <RefreshCw className={cn("w-4 h-4", calculateScore.isPending && "animate-spin")} /> 
          Recalculate Score
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 bg-primary text-primary-foreground border-none p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-primary/20">
          <div className="text-primary-foreground/80 font-medium tracking-widest uppercase text-sm mb-4">Total Score</div>
          <div className="text-8xl font-display font-bold mb-4">{Math.round(score.totalScore)}</div>
          <Badge className="bg-white/20 text-white hover:bg-white/30 text-lg px-6 py-2 mb-6 border-none">
            {score.category}
          </Badge>
          <p className="text-primary-foreground/80 leading-relaxed text-sm">
            {isBusiness
              ? "Your score measures your business's overall financial resilience based on the data you've provided."
              : "Your score is a measure of your overall financial resilience based on the data you've provided."}
          </p>
        </Card>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {components.map((comp, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{comp.title}</h3>
                    <InfoTooltip text={comp.tooltip} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Info className="w-3 h-3" /> {comp.desc}
                  </div>
                </div>
                <div className={cn("font-display font-bold text-2xl", getTextColor(comp.score))}>
                  {Math.round(comp.score)}<span className="text-sm text-muted-foreground font-sans">/25</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Score Component</span>
                  <span>{Math.round((comp.score / 25) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-accent/50 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", getScoreColor(comp.score).split(' ')[1])}
                    style={{ width: `${(comp.score / 25) * 100}%` }}
                  />
                </div>
                <div className="mt-4 text-sm bg-accent/20 p-3 rounded-lg border border-border/50 flex justify-between">
                  <span className="text-muted-foreground">Raw metric:</span>
                  <span className="font-semibold">{comp.isMonths ? `${comp.ratio.toFixed(1)} months` : `${(comp.ratio * 100).toFixed(1)}%`}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

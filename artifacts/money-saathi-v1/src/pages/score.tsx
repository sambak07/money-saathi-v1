import { useGetFinancialScore } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, cn } from "@/components/ui-elements";
import { RefreshCw, Info } from "lucide-react";
import { format } from "date-fns";

export default function Score() {
  const { data: score, isLoading } = useGetFinancialScore();
  const { calculateScore } = useFinanceMutations();

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
    calculateScore.mutate({});
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
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">No Score Available</h2>
          <Button onClick={handleRecalculate}>Calculate Initial Score</Button>
        </div>
      </Layout>
    );
  }

  const components = [
    { title: "Savings Habit", score: score.savingsScore, ratio: score.savingsRatio, desc: "Portion of income saved monthly." },
    { title: "Debt Burden", score: score.debtScore, ratio: score.debtRatio, desc: "Income dedicated to debt repayment." },
    { title: "Emergency Fund", score: score.emergencyScore, ratio: score.emergencyFundCoverage, desc: "Months of expenses covered by savings." },
    { title: "Expense Management", score: score.expenseScore, ratio: score.expenseRatio, desc: "Portion of income spent on living costs." },
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Health Score Breakdown</h1>
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
            Your score is a measure of your overall financial resilience based on the data you've provided.
          </p>
        </Card>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {components.map((comp, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{comp.title}</h3>
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
                  <span className="font-semibold">{comp.title === "Emergency Fund" ? `${comp.ratio.toFixed(1)} months` : `${(comp.ratio * 100).toFixed(1)}%`}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

import { useGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { ArrowRight, TrendingUp, TrendingDown, PiggyBank, Receipt, ShieldCheck, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function ScoreRing({ score, category }: { score: number; category: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return { ring: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-600" };
    if (s >= 60) return { ring: "hsl(var(--primary))", bg: "bg-primary/10", text: "text-primary" };
    if (s >= 40) return { ring: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-600" };
    return { ring: "#ef4444", bg: "bg-red-500/10", text: "text-red-600" };
  };
  const c = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="10" opacity="0.3" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={c.ring} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-display font-bold ${c.text}`}>{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground font-medium mt-0.5">out of 100</span>
        </div>
      </div>
      <Badge variant={score >= 60 ? "success" : score >= 40 ? "warning" : "destructive"} className="mt-3 text-sm px-4 py-1">
        {category}
      </Badge>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();

  if (isLoading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const score = data.financialScore?.totalScore || 0;
  const scoreCategory = data.financialScore?.category || "Unknown";
  const netSavings = data.netSavings || 0;
  const savingsPositive = netSavings >= 0;

  const chartData = (data.incomeVsExpenses || []).map((item: any) => ({
    ...item,
    gap: Math.max(0, item.income - item.expenses),
  }));

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Financial Overview</h1>
            <p className="text-muted-foreground mt-1">Your financial health at a glance.</p>
          </div>
          <Link href="/data-entry">
            <Button className="shrink-0 gap-2">
              Add Transaction <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <Card className="p-6 flex flex-col md:flex-row items-center gap-8">
          <ScoreRing score={score} category={scoreCategory} />
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold mb-1">Financial Health Score</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {score >= 80 ? "Excellent! Your finances are in great shape." :
               score >= 60 ? "Your finances are healthy. Keep it up." :
               score >= 40 ? "There's room for improvement in your finances." :
               "Your finances need attention. See recommendations below."}
            </p>
            <Link href="/score">
              <Button variant="outline" size="sm">View Full Breakdown</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              {savingsPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium">Net Savings</p>
              <p className={`text-xl font-bold truncate ${savingsPositive ? "text-emerald-600" : "text-red-600"}`}>
                {savingsPositive ? "" : "−"}{formatNu(Math.abs(netSavings))}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Income minus expenses & debts</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0"><PiggyBank className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium">Monthly Income</p>
              <p className="text-xl font-bold truncate">{formatNu(data.totalIncome)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0"><Receipt className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium">Obligations</p>
              <p className="text-xl font-bold truncate">{formatNu(data.totalObligations)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly debt payments</p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-1">Income vs Expenses</h2>
          <p className="text-sm text-muted-foreground mb-4">Current month comparison</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v === 0 ? "0" : `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.15 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value: number, name: string) => [formatNu(value), name]}
                />
                <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
                <Bar dataKey="expenses" name="Expenses" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill="hsl(var(--secondary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {data.topRecommendation && (
          <Card className="p-0 overflow-hidden border-none bg-gradient-to-r from-primary to-primary/85">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-xs font-semibold tracking-wider uppercase mb-1">Top Recommendation</p>
                  <h3 className="font-display font-bold text-xl text-white mb-1">{data.topRecommendation.title}</h3>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-2xl">
                    {data.topRecommendation.description}
                  </p>
                </div>
              </div>
              <Link href="/advisory">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap shrink-0">View All Advice</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

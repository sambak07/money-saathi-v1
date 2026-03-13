import { useGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { ArrowRight, TrendingUp, TrendingDown, Landmark, Shield, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function ScoreRing({ score, category }: { score: number; category: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return { ring: "#10b981", text: "text-emerald-600" };
    if (s >= 65) return { ring: "hsl(var(--primary))", text: "text-primary" };
    if (s >= 45) return { ring: "#f59e0b", text: "text-amber-600" };
    if (s >= 25) return { ring: "#f97316", text: "text-orange-600" };
    return { ring: "#ef4444", text: "text-red-600" };
  };
  const c = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="10" opacity="0.25" />
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
          <span className={`text-4xl font-display font-bold ${c.text}`}>{Math.round(score)}</span>
          <span className="text-[11px] text-muted-foreground font-medium">out of 100</span>
        </div>
      </div>
      <Badge
        variant={score >= 65 ? "success" : score >= 45 ? "warning" : "destructive"}
        className="mt-2 text-sm px-4 py-1"
      >
        {category}
      </Badge>
    </div>
  );
}

function RatioBar({ value, max, thresholds, label, unit }: {
  value: number; max: number;
  thresholds: { good: number; warn: number };
  label: string; unit: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value <= thresholds.good ? "bg-emerald-500" : value <= thresholds.warn ? "bg-amber-500" : "bg-red-500";
  const textColor = value <= thresholds.good ? "text-emerald-600" : value <= thresholds.warn ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className={`text-lg font-bold ${textColor}`}>{value}{unit}</span>
      </div>
      <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
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

  const fs = data.financialScore || {} as any;
  const score = fs.totalScore || 0;
  const scoreCategory = fs.category || "Unknown";
  const debtRatio = Math.round((fs.debtRatio || 0) * 100);
  const emergencyMonths = Math.round((fs.emergencyFundCoverage || 0) * 10) / 10;
  const netSavings = data.netSavings || 0;
  const savingsPositive = netSavings >= 0;

  const scoreMessage =
    score >= 80 ? "Excellent! Your finances are in great shape. Keep maintaining your habits." :
    score >= 65 ? "Your finances are healthy with room to grow. Focus on building reserves." :
    score >= 45 ? "There's room for improvement. Review the recommendation below." :
    score >= 25 ? "Your finances need attention. Take action on high-priority items." :
    "Critical state. Immediate steps are needed to stabilise your finances.";

  const chartData = (data.incomeVsExpenses || []).map((item: any) => ({
    ...item,
  }));

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Financial Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your complete financial snapshot.</p>
          </div>
          <Link href="/data-entry">
            <Button className="shrink-0 gap-2">
              Add Transaction <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
          <ScoreRing score={score} category={scoreCategory} />
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold mb-1">Financial Health Score</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{scoreMessage}</p>
            <Link href="/score">
              <Button variant="outline" size="sm">View Full Breakdown</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className={`p-2 rounded-lg shrink-0 ${savingsPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {savingsPositive ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Net Savings</p>
            </div>
            <p className={`text-2xl font-bold mt-2 ${savingsPositive ? "text-emerald-600" : "text-red-600"}`}>
              {savingsPositive ? "" : "−"}{formatNu(Math.abs(netSavings))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Income {formatNu(data.totalIncome)} − Expenses {formatNu(data.totalExpenses)}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg shrink-0"><Landmark className="w-4 h-4 text-amber-600" /></div>
              <p className="text-sm text-muted-foreground font-medium">Debt Ratio</p>
            </div>
            <RatioBar
              value={debtRatio} max={100}
              thresholds={{ good: 30, warn: 50 }}
              label={`${formatNu(data.totalObligations)} / mo`} unit="%"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {debtRatio <= 30 ? "Healthy — well within safe limits." : debtRatio <= 50 ? "Elevated — consider reducing debt." : "High — debt is straining your income."}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><Shield className="w-4 h-4 text-blue-600" /></div>
              <p className="text-sm text-muted-foreground font-medium">Emergency Fund</p>
            </div>
            <RatioBar
              value={emergencyMonths} max={12}
              thresholds={{ good: 6, warn: 3 }}
              label={`${emergencyMonths} months`} unit=" mo"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {emergencyMonths >= 6 ? "Strong — covers 6+ months of expenses." : emergencyMonths >= 3 ? "Building up — aim for 6 months." : "Low — prioritise building this fund."}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-1">Income vs Expenses</h2>
          <p className="text-sm text-muted-foreground mb-4">6-month trend</p>
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
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
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

import { useGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui-elements";
import { ArrowRight, Wallet, TrendingUp, PiggyBank, Receipt, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString()}`;
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
  
  // Score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Financial Overview</h1>
            <p className="text-muted-foreground mt-1">Here is your financial health status at a glance.</p>
          </div>
          <Link href="/data-entry">
            <Button className="shrink-0 gap-2">
              Add Transaction <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Income</p>
              <p className="text-xl font-bold">{formatNu(data.totalIncome)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-xl"><Receipt className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Expenses</p>
              <p className="text-xl font-bold">{formatNu(data.totalExpenses)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><PiggyBank className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Net Savings</p>
              <p className="text-xl font-bold">{formatNu(data.netSavings)}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Obligations</p>
              <p className="text-xl font-bold">{formatNu(data.totalObligations)}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score Panel */}
          <Card className="lg:col-span-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-card to-accent/20">
            <h2 className="text-lg font-bold mb-6 w-full text-left">Health Score</h2>
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray={`${(score / 100) * 283} 283`}
                  className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-display font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
                <span className="text-sm text-muted-foreground font-medium mt-1">out of 100</span>
              </div>
            </div>
            <Badge variant={score >= 60 ? "success" : "warning"} className="mb-4 text-sm px-4 py-1">{scoreCategory}</Badge>
            <Link href="/score" className="w-full">
              <Button variant="outline" className="w-full">View Details</Button>
            </Link>
          </Card>

          {/* Chart Panel */}
          <Card className="lg:col-span-2 p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-6">Income vs Expenses (6 Months)</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomeVsExpenses || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--accent))', opacity: 0.2}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Recommendation */}
        {data.topRecommendation && (
          <Card className="p-6 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-1">{data.topRecommendation.title}</h3>
                  <p className="text-primary-foreground/80 leading-relaxed max-w-3xl">
                    {data.topRecommendation.description}
                  </p>
                </div>
              </div>
              <Link href="/advisory">
                <Button className="bg-white text-primary hover:bg-white/90 whitespace-nowrap">View All Advice</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

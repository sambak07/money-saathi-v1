import { useState } from "react";
import { useGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, InfoTooltip } from "@/components/ui-elements";
import { ArrowRight, TrendingUp, TrendingDown, Landmark, Shield, Lightbulb, AlertTriangle, CheckCircle2, CircleAlert, Plus, Wallet, Receipt, PiggyBank, Banknote, BarChart3, Building2, User } from "lucide-react";
import { InsightsPanel } from "@/components/insights-panel";
import { BestNextOptions } from "@/components/best-next-options";
import { FinancialProgress } from "@/components/financial-progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const VERDICT_STYLES: Record<string, { gradient: string; icon: typeof CheckCircle2 }> = {
  Excellent:  { gradient: "from-emerald-600 to-emerald-500", icon: CheckCircle2 },
  Strong:     { gradient: "from-emerald-700 to-primary",     icon: CheckCircle2 },
  Moderate:   { gradient: "from-amber-600 to-amber-500",     icon: CircleAlert },
  Risk:       { gradient: "from-orange-600 to-orange-500",   icon: AlertTriangle },
  Critical:   { gradient: "from-red-600 to-red-500",         icon: AlertTriangle },
};

function ModeBadge({ mode }: { mode: "individual" | "small_business" }) {
  const isBusiness = mode === "small_business";
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${isBusiness ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
      {isBusiness ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      {isBusiness ? "Business Mode" : "Individual Mode"}
    </div>
  );
}

function VerdictLayer({ score, category, mainRisk, nextBestAction, hasData, mode }: {
  score: number; category: string; mainRisk: string; nextBestAction: string; hasData: boolean; mode: "individual" | "small_business";
}) {
  const style = VERDICT_STYLES[category] || VERDICT_STYLES.Moderate;
  const VerdictIcon = style.icon;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const isBusiness = mode === "small_business";

  return (
    <Card className={`p-0 overflow-hidden border-none bg-gradient-to-br ${style.gradient} text-white shadow-xl`}>
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
              <circle
                cx="48" cy="48" r="42" fill="none"
                stroke="white" strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold">{Math.round(score)}</span>
              <span className="text-[10px] text-white/70 font-medium">/ 100</span>
            </div>
          </div>
          <span className="mt-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {category}
          </span>
        </div>

        <div className="flex-1 w-full space-y-4 text-center md:text-left">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Main Risk</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <VerdictIcon className="w-5 h-5 text-white/80 shrink-0" />
              <p className="text-lg font-bold">{mainRisk}</p>
            </div>
          </div>
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Next Best Action</p>
            <p className="text-white/90 text-sm leading-relaxed font-medium">{nextBestAction}</p>
          </div>
          {!hasData && (
            <Link href="/data-entry">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-none mt-2 gap-2">
                <Plus className="w-4 h-4" /> {isBusiness ? "Enter Business Data" : "Enter Financial Data"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyDataNotice({ isBusiness }: { isBusiness: boolean }) {
  const steps = isBusiness
    ? [
        { step: "1", label: "Revenue", desc: "Sales, services, etc." },
        { step: "2", label: "Operating Expenses", desc: "Rent, payroll, supplies" },
        { step: "3", label: "Business Loans", desc: "Loan EMIs, credit lines" },
        { step: "4", label: "Cash Balance", desc: "Bank balance, reserves" },
      ]
    : [
        { step: "1", label: "Income", desc: "Salary, freelance, etc." },
        { step: "2", label: "Expenses", desc: "Rent, food, utilities" },
        { step: "3", label: "Personal Loans", desc: "Loan EMIs, debts" },
        { step: "4", label: "Savings", desc: "Bank, emergency fund" },
      ];

  return (
    <Card className="p-8 border-dashed border-2 bg-transparent">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="p-4 bg-primary/10 rounded-2xl mb-4">
          {isBusiness ? <Building2 className="w-8 h-8 text-primary" /> : <Wallet className="w-8 h-8 text-primary" />}
        </div>
        <h3 className="text-lg font-bold mb-2">
          {isBusiness ? "Add your business data to unlock insights" : "Add your financial data to unlock insights"}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {isBusiness
            ? "Start by entering your monthly revenue, then add operating expenses, loans, and cash reserves. Your dashboard will come alive with business health scores, charts, and recommendations."
            : "Start by entering your monthly income, then add expenses, obligations, and savings. Your dashboard will come alive with personalised scores, charts, and recommendations."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full mb-6">
          {steps.map(s => (
            <div key={s.step} className="bg-muted/30 rounded-xl p-3 text-left">
              <span className="text-xs font-bold text-primary">Step {s.step}</span>
              <p className="font-semibold text-sm mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <Link href="/data-entry">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Start Entering Data
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function MissingDataHint({ icon: Icon, iconBg, title, message }: {
  icon: typeof Wallet; iconBg: string; title: string; message: string;
}) {
  return (
    <div className="flex items-start gap-3 mt-2 bg-muted/20 rounded-lg p-2.5">
      <div className={`p-1.5 rounded-md shrink-0 ${iconBg}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{message}</p>
      </div>
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

function IndividualMetrics({ data, dp }: { data: any; dp: any }) {
  const fs = data.financialScore || {} as any;
  const debtRatio = Math.round((fs.debtRatio || 0) * 100);
  const emergencyMonths = Math.round((fs.emergencyFundCoverage || 0) * 10) / 10;
  const netSavings = data.netSavings || 0;
  const savingsPositive = netSavings >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className={`p-2 rounded-lg shrink-0 ${savingsPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            {savingsPositive ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Net Savings</p>
          <InfoTooltip text="Income minus expenses and loan payments. A positive number means you're saving; negative means you're spending more than you earn." />
        </div>
        <p className={`text-2xl font-bold mt-2 ${savingsPositive ? "text-emerald-600" : "text-red-600"}`}>
          {savingsPositive ? "" : "−"}{formatNu(Math.abs(netSavings))}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Income {formatNu(data.totalIncome)} − Expenses {formatNu(data.totalExpenses)}
        </p>
        {!dp.hasIncome && (
          <MissingDataHint icon={Banknote} iconBg="bg-emerald-500/10 text-emerald-600" title="No income entered" message="Add your salary or other income sources to see accurate net savings." />
        )}
        {dp.hasIncome && !dp.hasExpenses && (
          <MissingDataHint icon={Receipt} iconBg="bg-red-500/10 text-red-600" title="No expenses entered" message="Add rent, food, utilities, etc. to get a realistic savings picture." />
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 rounded-lg shrink-0"><Landmark className="w-4 h-4 text-amber-600" /></div>
          <p className="text-sm text-muted-foreground font-medium">Debt Ratio</p>
          <InfoTooltip text="Percentage of monthly income going to loan EMIs and debt payments. Below 30% is healthy, above 50% is risky." />
        </div>
        {dp.hasObligations || dp.hasIncome ? (
          <>
            <RatioBar value={debtRatio} max={100} thresholds={{ good: 30, warn: 50 }} label={`${formatNu(data.totalObligations)} / mo`} unit="%" />
            <p className="text-xs text-muted-foreground mt-2">
              {!dp.hasObligations ? "No loan obligations recorded. Add any EMIs or debt payments for an accurate ratio." : debtRatio <= 30 ? "Healthy — well within safe limits." : debtRatio <= 50 ? "Elevated — consider reducing debt." : "High — debt is straining your income."}
            </p>
          </>
        ) : (
          <MissingDataHint icon={Landmark} iconBg="bg-amber-500/10 text-amber-600" title="No obligations entered" message="Add loan EMIs, credit card debt, or other monthly payments. If you have none, your debt ratio is 0% — great!" />
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><Shield className="w-4 h-4 text-blue-600" /></div>
          <p className="text-sm text-muted-foreground font-medium">Emergency Fund</p>
          <InfoTooltip text="How many months of expenses your savings can cover if income stops. 6+ months is the recommended target." />
        </div>
        {dp.hasSavings ? (
          <>
            <RatioBar value={emergencyMonths} max={12} thresholds={{ good: 6, warn: 3 }} label={`${emergencyMonths} months`} unit=" mo" />
            <p className="text-xs text-muted-foreground mt-2">
              {emergencyMonths >= 6 ? "Strong — covers 6+ months of expenses." : emergencyMonths >= 3 ? "Building up — aim for 6 months." : "Low — prioritise building this fund."}
            </p>
          </>
        ) : (
          <MissingDataHint icon={PiggyBank} iconBg="bg-blue-500/10 text-blue-600" title="No savings recorded" message="Add your savings accounts and emergency fund balance. This measures how many months of expenses you can cover." />
        )}
      </Card>
    </div>
  );
}

function BusinessMetrics({ data, dp }: { data: any; dp: any }) {
  const fs = data.financialScore || {} as any;
  const profitMarginPct = Math.round((fs.profitMargin || 0) * 100);
  const debtRatio = Math.round((fs.debtRatio || 0) * 100);
  const cashReserveMonths = Math.round((fs.cashReserveMonths || 0) * 10) / 10;
  const netProfit = data.netSavings || 0;
  const profitable = netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className={`p-2 rounded-lg shrink-0 ${profitable ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            {profitable ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Net Profit</p>
          <InfoTooltip text="Revenue minus operating expenses and loan payments. A positive number means the business is profitable." />
        </div>
        <p className={`text-2xl font-bold mt-2 ${profitable ? "text-emerald-600" : "text-red-600"}`}>
          {profitable ? "" : "−"}{formatNu(Math.abs(netProfit))}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Revenue {formatNu(data.totalIncome)} − OpEx {formatNu(data.totalExpenses)}
        </p>
        {!dp.hasIncome && (
          <MissingDataHint icon={Banknote} iconBg="bg-emerald-500/10 text-emerald-600" title="No revenue entered" message="Add your monthly sales or service revenue to calculate net profit." />
        )}
        {dp.hasIncome && !dp.hasExpenses && (
          <MissingDataHint icon={Receipt} iconBg="bg-red-500/10 text-red-600" title="No operating expenses entered" message="Add rent, payroll, supplies, etc. to see true profitability." />
        )}
        {dp.hasIncome && dp.hasExpenses && (
          <div className="mt-2 text-xs text-muted-foreground">
            Profit margin: <span className={`font-bold ${profitMarginPct >= 20 ? "text-emerald-600" : profitMarginPct >= 10 ? "text-amber-600" : "text-red-600"}`}>{profitMarginPct}%</span>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 rounded-lg shrink-0"><Landmark className="w-4 h-4 text-amber-600" /></div>
          <p className="text-sm text-muted-foreground font-medium">Debt-to-Revenue</p>
          <InfoTooltip text="Percentage of monthly revenue going to business loan payments. Below 30% is healthy, above 50% puts cash flow at risk." />
        </div>
        {dp.hasObligations || dp.hasIncome ? (
          <>
            <RatioBar value={debtRatio} max={100} thresholds={{ good: 30, warn: 50 }} label={`${formatNu(data.totalObligations)} / mo`} unit="%" />
            <p className="text-xs text-muted-foreground mt-2">
              {!dp.hasObligations ? "No business loans recorded. Add any loan EMIs for an accurate ratio." : debtRatio <= 30 ? "Healthy — business debt is manageable." : debtRatio <= 50 ? "Elevated — consider reducing business debt." : "High — debt is straining revenue."}
            </p>
          </>
        ) : (
          <MissingDataHint icon={Landmark} iconBg="bg-amber-500/10 text-amber-600" title="No business loans entered" message="Add loan EMIs, credit lines, or other business debt payments." />
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><Shield className="w-4 h-4 text-blue-600" /></div>
          <p className="text-sm text-muted-foreground font-medium">Cash Reserve</p>
          <InfoTooltip text="How many months of operating expenses your cash balance can cover. 3+ months is recommended for business continuity." />
        </div>
        {dp.hasSavings ? (
          <>
            <RatioBar value={cashReserveMonths} max={6} thresholds={{ good: 3, warn: 1 }} label={`${cashReserveMonths} months`} unit=" mo" />
            <p className="text-xs text-muted-foreground mt-2">
              {cashReserveMonths >= 3 ? "Strong — covers 3+ months of operating expenses." : cashReserveMonths >= 1 ? "Building up — aim for 3 months." : "Low — prioritise building an operating reserve."}
            </p>
          </>
        ) : (
          <MissingDataHint icon={PiggyBank} iconBg="bg-blue-500/10 text-blue-600" title="No cash balance recorded" message="Add your business bank balances and reserves. This measures how many months of operating expenses you can cover." />
        )}
      </Card>
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
  const scoreCategory = fs.category || "Moderate";
  const verdict = data.verdict || { category: scoreCategory, mainRisk: "Unknown", nextBestAction: "Add financial data", hasData: false };
  const hasData = verdict.hasData;
  const dp = data.dataPresence || { hasIncome: false, hasExpenses: false, hasObligations: false, hasSavings: false };
  const profileType = data.profileType || "individual";
  const isBusiness = profileType === "small_business";

  const chartData = (data.incomeVsExpenses || []).map((item: any) => ({ ...item }));
  const hasChartData = chartData.some((d: any) => d.income > 0 || d.expenses > 0);

  const incomeLabel = isBusiness ? "Revenue" : "Income";
  const expenseLabel = isBusiness ? "Operating Expenses" : "Expenses";

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {isBusiness ? "Business Health Dashboard" : "Financial Health Dashboard"}
              </h1>
              <ModeBadge mode={profileType} />
            </div>
            <p className="text-muted-foreground">
              {isBusiness ? "Your complete business financial snapshot." : "Your complete financial snapshot."}
            </p>
          </div>
          <Link href="/data-entry">
            <Button className="shrink-0 gap-2">
              {isBusiness ? "Add Business Data" : "Add Transaction"} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <VerdictLayer
          score={score}
          category={verdict.category}
          mainRisk={verdict.mainRisk}
          nextBestAction={verdict.nextBestAction}
          hasData={hasData}
          mode={profileType}
        />

        {!hasData ? (
          <EmptyDataNotice isBusiness={isBusiness} />
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Key Metrics</h2>
              <p className="text-sm text-muted-foreground mb-4">Your core financial indicators at a glance.</p>
            </div>
            {isBusiness ? <BusinessMetrics data={data} dp={dp} /> : <IndividualMetrics data={data} dp={dp} />}

            {(data as any).insights && (data as any).insights.length > 0 && (
              <>
                <div className="mt-2">
                  <h2 className="text-lg font-bold text-foreground mb-1">Insights</h2>
                  <p className="text-sm text-muted-foreground mb-4">Observations based on your financial data.</p>
                </div>
                <InsightsPanel insights={(data as any).insights} />
              </>
            )}

            {(data as any).bestNextOptions && (
              <>
                <div className="mt-2">
                  <h2 className="text-lg font-bold text-foreground mb-1">Recommended Products</h2>
                  <p className="text-sm text-muted-foreground mb-4">Bhutanese financial products matched to your profile.</p>
                </div>
                <BestNextOptions data={(data as any).bestNextOptions} />
              </>
            )}

            {hasChartData ? (
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-1">{incomeLabel} vs {expenseLabel}</h2>
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
                      <Bar dataKey="income" name={incomeLabel} radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {chartData.map((_: any, i: number) => (
                          <Cell key={i} fill="hsl(var(--primary))" />
                        ))}
                      </Bar>
                      <Bar dataKey="expenses" name={expenseLabel} radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {chartData.map((_: any, i: number) => (
                          <Cell key={i} fill="hsl(var(--secondary))" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-dashed border-2 bg-transparent flex items-start gap-4">
                <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{incomeLabel} vs {expenseLabel} chart</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {!dp.hasIncome
                      ? `Add your ${incomeLabel.toLowerCase()} to see this chart.`
                      : `Add your ${expenseLabel.toLowerCase()} to compare against ${incomeLabel.toLowerCase()}.`}
                  </p>
                  <Link href="/data-entry" className="inline-block mt-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> {!dp.hasIncome ? `Add ${incomeLabel}` : `Add ${expenseLabel}`}
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            <FinancialProgress isBusiness={isBusiness} />

            {data.topRecommendation && (
              <Card className="p-0 overflow-hidden border-none bg-gradient-to-r from-primary to-primary/85">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs font-semibold tracking-wider uppercase mb-1">
                        {isBusiness ? "Business Recommendation" : "Detailed Recommendation"}
                      </p>
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
          </>
        )}
      </div>
    </Layout>
  );
}

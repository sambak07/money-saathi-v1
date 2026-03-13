import { useState } from "react";
import { Card } from "@/components/ui-elements";
import { useGetTimeline } from "@workspace/api-client-react";
import type { FinancialSnapshotData } from "@workspace/api-client-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, TrendingUp, TrendingDown, Shield, PiggyBank,
  ArrowUpRight, ArrowDownRight, Minus, ChevronRight,
} from "lucide-react";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

function formatNu(val: number): string {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatK(v: number): string {
  if (v === 0) return "0";
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(Math.round(v));
}

function TrendIndicator({ current, previous, suffix, invert }: {
  current: number;
  previous: number;
  suffix?: string;
  invert?: boolean;
}) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">No change</span>;
  const diff = current - previous;
  const isPositive = invert ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.01;

  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" /> Stable
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(diff).toFixed(suffix === "%" ? 1 : 0)}{suffix || ""}
    </span>
  );
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  padding: '8px 12px',
};

function MiniChart({ data, dataKey, color, height = 140, formatY, tooltipFormat, label }: {
  data: any[];
  dataKey: string;
  color: string;
  height?: number;
  formatY: (v: number) => string;
  tooltipFormat: (v: number) => string;
  label: string;
}) {
  const gradientId = `grad-${dataKey}`;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={5} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatY} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [tooltipFormat(v), label]} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={{ r: 3, fill: color, strokeWidth: 1.5, stroke: "white" }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreCard({ title, value, format, icon: Icon, color, trend }: {
  title: string;
  value: string;
  format?: string;
  icon: typeof TrendingUp;
  color: string;
  trend: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
      {trend}
    </div>
  );
}

function MilestoneTimeline({ snapshots, isBusiness }: { snapshots: FinancialSnapshotData[]; isBusiness: boolean }) {
  if (snapshots.length < 2) return null;

  const milestones: { month: string; label: string; type: "positive" | "warning" | "neutral" }[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    const monthLabel = formatMonthLabel(curr.month);

    if (curr.financialScore >= 70 && prev.financialScore < 70) {
      milestones.push({ month: monthLabel, label: `Score reached ${Math.round(curr.financialScore)} — ${isBusiness ? "Healthy business" : "Healthy finances"}`, type: "positive" });
    } else if (curr.financialScore >= 50 && prev.financialScore < 50) {
      milestones.push({ month: monthLabel, label: `Score crossed 50 — ${isBusiness ? "Business stabilising" : "Finances stabilising"}`, type: "positive" });
    }

    if (!isBusiness && curr.emergencyFundMonths >= 6 && prev.emergencyFundMonths < 6) {
      milestones.push({ month: monthLabel, label: "Emergency fund covers 6+ months — strong safety net", type: "positive" });
    } else if (!isBusiness && curr.emergencyFundMonths >= 3 && prev.emergencyFundMonths < 3) {
      milestones.push({ month: monthLabel, label: "Emergency fund covers 3+ months", type: "positive" });
    }

    if (isBusiness && curr.emergencyFundMonths >= 3 && prev.emergencyFundMonths < 3) {
      milestones.push({ month: monthLabel, label: "Cash reserve covers 3+ months of operations", type: "positive" });
    }

    if (curr.debtRatio < 0.3 && prev.debtRatio >= 0.3) {
      milestones.push({ month: monthLabel, label: `${isBusiness ? "Debt-to-revenue" : "Debt ratio"} dropped below 30% — safe zone`, type: "positive" });
    }

    if (isBusiness && curr.profitMargin > 0 && prev.profitMargin <= 0) {
      milestones.push({ month: monthLabel, label: "Business turned profitable", type: "positive" });
    }

    if (curr.debtRatio > 0.5 && prev.debtRatio <= 0.5) {
      milestones.push({ month: monthLabel, label: `${isBusiness ? "Debt-to-revenue" : "Debt ratio"} exceeded 50% — needs attention`, type: "warning" });
    }

    if (curr.financialScore < prev.financialScore - 10) {
      milestones.push({ month: monthLabel, label: `Score dropped ${Math.round(prev.financialScore - curr.financialScore)} points`, type: "warning" });
    }

    const prevNet = prev.totalIncome - prev.totalExpenses;
    const currNet = curr.totalIncome - curr.totalExpenses;
    if (currNet > 0 && prevNet <= 0 && curr.totalIncome > 0) {
      milestones.push({ month: monthLabel, label: isBusiness ? "Net profit turned positive" : "Net savings turned positive", type: "positive" });
    }
  }

  const last = snapshots[snapshots.length - 1];
  const first = snapshots[0];
  const scoreDiff = last.financialScore - first.financialScore;
  if (Math.abs(scoreDiff) >= 5 && milestones.length === 0) {
    milestones.push({
      month: formatMonthLabel(last.month),
      label: scoreDiff > 0
        ? `Score improved by ${Math.round(scoreDiff)} points since ${formatMonthLabel(first.month)}`
        : `Score declined by ${Math.round(Math.abs(scoreDiff))} points since ${formatMonthLabel(first.month)}`,
      type: scoreDiff > 0 ? "positive" : "warning",
    });
  }

  if (milestones.length === 0) return null;

  const recent = milestones.slice(-5).reverse();

  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Financial Milestones
      </h3>
      <div className="space-y-0">
        {recent.map((m, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                m.type === "positive" ? "bg-emerald-500" : m.type === "warning" ? "bg-amber-500" : "bg-muted-foreground"
              }`} />
              {i < recent.length - 1 && <div className="w-px flex-1 bg-border min-h-[24px]" />}
            </div>
            <div className={`pb-4 ${i === recent.length - 1 ? "pb-0" : ""}`}>
              <p className="text-xs font-bold text-muted-foreground">{m.month}</p>
              <p className={`text-sm leading-snug ${
                m.type === "positive" ? "text-emerald-700" : m.type === "warning" ? "text-amber-700" : "text-foreground"
              }`}>
                {m.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FinancialProgress({ isBusiness }: { isBusiness: boolean }) {
  const { data: snapshots, isLoading } = useGetTimeline();

  if (isLoading) return null;

  if (!snapshots || snapshots.length === 0) {
    return (
      <Card className="p-6 border-dashed border-2 bg-transparent flex items-start gap-4">
        <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-0.5">Financial Progress</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your progress timeline will appear here once you start adding financial data. Each month's snapshot tracks your improvement over time.
          </p>
        </div>
      </Card>
    );
  }

  const chartData = snapshots.map((s: FinancialSnapshotData) => ({
    month: formatMonthLabel(s.month),
    score: Math.round(s.financialScore),
    income: Math.round(s.totalIncome),
    expenses: Math.round(s.totalExpenses),
    netSavings: Math.round(s.totalIncome - s.totalExpenses),
    savings: Math.round(s.totalSavings),
    debtRatio: Math.round(s.debtRatio * 10000) / 100,
    emergencyMonths: Math.round(s.emergencyFundMonths * 10) / 10,
    profitMargin: Math.round(s.profitMargin * 10000) / 100,
  }));

  const latest = chartData[chartData.length - 1];
  const prev = chartData.length >= 2 ? chartData[chartData.length - 2] : latest;

  const incomeLabel = isBusiness ? "Revenue" : "Income";
  const savingsLabel = isBusiness ? "Net Profit" : "Net Savings";
  const reserveLabel = isBusiness ? "Cash Reserve" : "Emergency Fund";
  const debtLabel = isBusiness ? "Debt-to-Revenue" : "Debt Ratio";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Financial Progress</h2>
          <p className="text-sm text-muted-foreground">
            {isBusiness ? "Track your business financial health over time" : "Track your financial improvement over time"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <ScoreCard
            title="Health Score"
            value={`${latest.score} / 100`}
            icon={Activity}
            color="bg-emerald-50 text-emerald-600"
            trend={<TrendIndicator current={latest.score} previous={prev.score} />}
          />
        </Card>
        <Card className="p-4">
          <ScoreCard
            title={savingsLabel}
            value={formatNu(latest.netSavings)}
            icon={PiggyBank}
            color="bg-violet-50 text-violet-600"
            trend={<TrendIndicator current={latest.netSavings} previous={prev.netSavings} suffix="" />}
          />
        </Card>
        <Card className="p-4">
          <ScoreCard
            title={debtLabel}
            value={`${latest.debtRatio}%`}
            icon={Shield}
            color="bg-amber-50 text-amber-600"
            trend={<TrendIndicator current={latest.debtRatio} previous={prev.debtRatio} suffix="%" invert />}
          />
        </Card>
        <Card className="p-4">
          <ScoreCard
            title={reserveLabel}
            value={`${latest.emergencyMonths} mo`}
            icon={TrendingUp}
            color="bg-blue-50 text-blue-600"
            trend={<TrendIndicator current={latest.emergencyMonths} previous={prev.emergencyMonths} suffix=" mo" />}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">Score Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">Health score (0–100) over time</p>
          <MiniChart
            data={chartData}
            dataKey="score"
            color="#16a34a"
            formatY={(v) => String(v)}
            tooltipFormat={(v) => `${v} / 100`}
            label="Health Score"
          />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">{savingsLabel} Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isBusiness ? "Revenue minus operating expenses" : "Income minus expenses each month"}
          </p>
          <MiniChart
            data={chartData}
            dataKey="netSavings"
            color="#7c3aed"
            formatY={formatK}
            tooltipFormat={formatNu}
            label={savingsLabel}
          />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">{debtLabel} Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isBusiness ? "Business debt as % of revenue" : "Monthly obligations as % of income"} — below 30% is healthy
          </p>
          <MiniChart
            data={chartData}
            dataKey="debtRatio"
            color="#ea580c"
            formatY={(v) => `${v}%`}
            tooltipFormat={(v) => `${v}%`}
            label={debtLabel}
          />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-1">{reserveLabel} Growth</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isBusiness ? "Months of operating expenses covered by cash reserves" : "Months of expenses covered by emergency savings"} — 3+ months recommended
          </p>
          <MiniChart
            data={chartData}
            dataKey="emergencyMonths"
            color="#2563eb"
            formatY={(v) => `${v}mo`}
            tooltipFormat={(v) => `${v} months`}
            label={reserveLabel}
          />
        </Card>
      </div>

      <MilestoneTimeline snapshots={snapshots as FinancialSnapshotData[]} isBusiness={isBusiness} />
    </div>
  );
}

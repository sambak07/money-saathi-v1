import { Link } from "wouter";
import { Card } from "@/components/ui-elements";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight, Sparkles, BookOpen } from "lucide-react";

interface FinancialInsight {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  explanation: string;
  recommendedAction: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  literacyLink: { label: string; path: string };
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    border: "border-red-200",
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badge: "bg-red-100 text-red-700",
    badgeLabel: "Critical",
    progressColor: "bg-red-500",
    progressTrack: "bg-red-100",
  },
  warning: {
    icon: AlertCircle,
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    badgeLabel: "Attention",
    progressColor: "bg-amber-500",
    progressTrack: "bg-amber-100",
  },
  info: {
    icon: Info,
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    badgeLabel: "Guidance",
    progressColor: "bg-blue-500",
    progressTrack: "bg-blue-100",
  },
  positive: {
    icon: CheckCircle2,
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    badgeLabel: "On Track",
    progressColor: "bg-emerald-500",
    progressTrack: "bg-emerald-100",
  },
};

function InsightCard({ insight }: { insight: FinancialInsight }) {
  const config = SEVERITY_CONFIG[insight.severity];
  const Icon = config.icon;
  const progress = insight.targetValue > 0
    ? Math.min(100, Math.max(0, (insight.currentValue / insight.targetValue) * 100))
    : 0;

  return (
    <Card className={`p-0 overflow-hidden border ${config.border}`}>
      <div className={`${config.bg} p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${config.iconBg}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-sm text-foreground">{insight.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
                {config.badgeLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{insight.explanation}</p>
          </div>
        </div>

        <div className="mt-4 ml-11">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{insight.metric}</span>
            <span className="text-xs font-bold">
              {insight.currentValue}{insight.metric.includes("%") || insight.metric.includes("Ratio") ? "%" : ""} / {insight.targetValue}{insight.metric.includes("%") || insight.metric.includes("Ratio") ? "%" : ""}
            </span>
          </div>
          <div className={`h-2 rounded-full ${config.progressTrack}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${config.progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-background px-4 sm:px-5 py-3 space-y-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</p>
          <p className="text-sm text-foreground leading-relaxed">{insight.recommendedAction}</p>
        </div>
        <Link href={insight.literacyLink.path}>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer">
            <BookOpen className="w-3.5 h-3.5" />
            {insight.literacyLink.label}
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>
    </Card>
  );
}

export function InsightsPanel({ insights }: { insights: FinancialInsight[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Financial Insights</h2>
          <p className="text-sm text-muted-foreground">Automated analysis of your financial data with actionable guidance</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

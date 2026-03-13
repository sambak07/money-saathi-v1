import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui-elements";
import {
  Building2, ExternalLink, AlertTriangle, ArrowRight,
  Compass, ShieldCheck, CheckCircle2, Shield, TrendingUp,
  ArrowUpRight, Scale, ChevronDown, ChevronUp, Sparkles,
  Target, Gauge, PiggyBank, Zap,
} from "lucide-react";
import { FreshnessBadge, ConfidenceBadge, SourceLink } from "@/components/data-transparency";

interface AlternativeProduct {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  tradeoff: string;
  sourceUrl: string | null;
}

interface ProductRecommendation {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  whyItFits: string;
  keyFeature: string;
  sourceUrl: string | null;
  lastUpdated: string;
  recommendationType: string;
  reasons: string[];
  alternatives: AlternativeProduct[];
  comparisonBasis: string;
}

interface BestNextOptionsData {
  recommendations: ProductRecommendation[];
  cautionMessage: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  savings: "Savings",
  fd: "Fixed Deposit",
  housing: "Housing Loan",
  personal: "Personal Loan",
  education: "Education Loan",
  advisory: "Advisory",
};

const TYPE_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle2 }> = {
  "Best Fit": { color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: CheckCircle2 },
  "Better Rate but Higher Requirement": { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: TrendingUp },
  "Safer Alternative": { color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: Shield },
  "Improve Finances First": { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: AlertTriangle },
};

const BASIS_CONFIG: Record<string, { label: string; icon: typeof Target }> = {
  affordability: { label: "Affordability", icon: Gauge },
  "minimum balance": { label: "Minimum Balance", icon: PiggyBank },
  "product fit": { label: "Product Fit", icon: Target },
  "current financial risk": { label: "Financial Risk", icon: Shield },
  "savings goal": { label: "Savings Goal", icon: Sparkles },
};

function RecommendationCard({ rec }: { rec: ProductRecommendation }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const typeConf = TYPE_CONFIG[rec.recommendationType] || TYPE_CONFIG["Best Fit"];
  const TypeIcon = typeConf.icon;
  const basisConf = BASIS_CONFIG[rec.comparisonBasis] || BASIS_CONFIG["product fit"];
  const BasisIcon = basisConf.icon;
  const isImproveFirst = rec.recommendationType === "Improve Finances First";

  const lastUpdated = new Date(rec.lastUpdated).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Card className={`p-0 overflow-hidden flex flex-col ${typeConf.borderColor} hover:shadow-md transition-all duration-200`}>
      <div className={`px-5 py-2.5 ${typeConf.bgColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <TypeIcon className={`w-3.5 h-3.5 ${typeConf.color}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${typeConf.color}`}>
            {rec.recommendationType}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BasisIcon className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Based on {basisConf.label}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isImproveFirst ? "bg-red-50" : "bg-primary/10"}`}>
              <Building2 className={`w-4 h-4 ${isImproveFirst ? "text-red-600" : "text-primary"}`} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{rec.institutionName}</p>
              <p className="text-xs text-muted-foreground">{rec.productName}</p>
            </div>
          </div>
          {rec.productCategory !== "advisory" && (
            <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              {CATEGORY_LABELS[rec.productCategory] || rec.productCategory}
            </span>
          )}
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Why This Is Best</p>
          <ul className="space-y-1.5">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-snug">
                <Zap className={`w-3 h-3 mt-0.5 shrink-0 ${typeConf.color}`} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Our Assessment</p>
          <p className="text-sm text-foreground leading-relaxed">{rec.whyItFits}</p>
        </div>

        {rec.keyFeature && (
          <div className={`rounded-xl px-3 py-2 mb-4 ${isImproveFirst ? "bg-red-50/50" : "bg-muted/30"}`}>
            <p className={`text-xs font-semibold ${isImproveFirst ? "text-red-700" : "text-primary"}`}>{rec.keyFeature}</p>
          </div>
        )}

        {rec.alternatives.length > 0 && (
          <div className="mt-auto">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
            >
              <Scale className="w-3 h-3" />
              <span>{rec.alternatives.length} Alternative{rec.alternatives.length > 1 ? "s" : ""} to Consider</span>
              {showAlternatives
                ? <ChevronUp className="w-3 h-3 ml-auto" />
                : <ChevronDown className="w-3 h-3 ml-auto" />
              }
            </button>

            {showAlternatives && (
              <div className="mt-2.5 space-y-2">
                {rec.alternatives.map(alt => (
                  <div key={alt.id} className="bg-muted/20 border border-border/50 rounded-xl px-3.5 py-2.5 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{alt.institutionName} — {alt.productName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug italic">{alt.tradeoff}</p>
                    </div>
                    {alt.sourceUrl && (
                      <a
                        href={alt.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 bg-muted/10 border-t border-border/40 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isImproveFirst ? (
            <Link href="/intelligence/literacy">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                <ArrowUpRight className="w-3 h-3" />
                Improve First
              </span>
            </Link>
          ) : (
            <>
              {rec.sourceUrl && (
                <a
                  href={rec.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Official Source
                </a>
              )}
              {rec.alternatives.length > 0 && (
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-xs font-bold rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <Scale className="w-3 h-3" />
                  Compare Alternatives
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            Source: {rec.institutionName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Updated: {lastUpdated}
          </span>
          <FreshnessBadge lastUpdated={rec.lastUpdated} />
          <ConfidenceBadge lastUpdated={rec.lastUpdated} hasSource={!!rec.sourceUrl} />
        </div>
      </div>
    </Card>
  );
}

function CautionCard({ message }: { message: string }) {
  return (
    <Card className="p-5 border-amber-200 bg-amber-50/80">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-xl shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-amber-900 mb-1">Improve Financial Health First</h3>
          <p className="text-sm text-amber-800 leading-relaxed">{message}</p>
          <Link href="/intelligence/literacy">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline cursor-pointer mt-3">
              Visit Financial Literacy Center
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function BestNextOptions({ data }: { data: BestNextOptionsData }) {
  const hasRecs = data.recommendations.length > 0;
  const hasCaution = !!data.cautionMessage;
  const allImproveFirst = hasRecs && data.recommendations.every(r => r.recommendationType === "Improve Finances First");

  if (!hasRecs && !hasCaution) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Best Next Options</h2>
          <p className="text-sm text-muted-foreground">
            {allImproveFirst
              ? "Your financial advisor recommends strengthening your position first"
              : "Products matched to your financial condition from Bhutan's banks"
            }
          </p>
        </div>
      </div>

      {hasCaution && !hasRecs && <CautionCard message={data.cautionMessage!} />}

      {hasCaution && hasRecs && !allImproveFirst && (
        <div className="mb-4">
          <CautionCard message={data.cautionMessage!} />
        </div>
      )}

      {hasRecs && (
        <div className={`grid grid-cols-1 ${data.recommendations.length === 1 ? "max-w-2xl" : data.recommendations.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4`}>
          {data.recommendations.map(rec => (
            <RecommendationCard key={`${rec.id}-${rec.productCategory}`} rec={rec} />
          ))}
        </div>
      )}

      {hasRecs && !allImproveFirst && (
        <div className="flex items-center justify-center mt-4">
          <Link href="/intelligence/banks">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5" />
              Compare all products in the Bank Comparison tool
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

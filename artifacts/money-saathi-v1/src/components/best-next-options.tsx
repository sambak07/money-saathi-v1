import { Link } from "wouter";
import { Card } from "@/components/ui-elements";
import { Building2, ExternalLink, Clock, AlertTriangle, ArrowRight, Compass, ShieldCheck } from "lucide-react";

interface ProductRecommendation {
  id: number;
  institutionName: string;
  productName: string;
  productCategory: string;
  whyItFits: string;
  keyFeature: string;
  sourceUrl: string | null;
  lastUpdated: string;
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
};

function RecommendationCard({ rec }: { rec: ProductRecommendation }) {
  const lastUpdated = new Date(rec.lastUpdated).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <Card className="p-0 overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{rec.institutionName}</p>
              <p className="text-xs text-muted-foreground">{rec.productName}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
            {CATEGORY_LABELS[rec.productCategory] || rec.productCategory}
          </span>
        </div>

        <div className="mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Why This Fits You</p>
          <p className="text-sm text-foreground leading-relaxed">{rec.whyItFits}</p>
        </div>

        <div className="bg-muted/30 rounded-xl px-3 py-2">
          <p className="text-xs font-semibold text-primary">{rec.keyFeature}</p>
        </div>
      </div>

      <div className="px-5 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Updated: {lastUpdated}</span>
        </div>
        {rec.sourceUrl && (
          <a
            href={rec.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </Card>
  );
}

function CautionCard({ message }: { message: string }) {
  return (
    <Card className="p-5 border-amber-200 bg-amber-50">
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

  if (!hasRecs && !hasCaution) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Best Next Options</h2>
          <p className="text-sm text-muted-foreground">Products matched to your financial condition from Bhutan's banks</p>
        </div>
      </div>

      {hasCaution && !hasRecs && <CautionCard message={data.cautionMessage!} />}

      {hasCaution && hasRecs && (
        <div className="space-y-4">
          <CautionCard message={data.cautionMessage!} />
          <div className={`grid grid-cols-1 ${data.recommendations.length === 1 ? "" : data.recommendations.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4`}>
            {data.recommendations.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {!hasCaution && hasRecs && (
        <div className={`grid grid-cols-1 ${data.recommendations.length === 1 ? "" : data.recommendations.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4`}>
          {data.recommendations.map(rec => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}

      {hasRecs && (
        <div className="flex items-center justify-center mt-3">
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

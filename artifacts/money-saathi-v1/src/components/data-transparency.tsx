import { ExternalLink, Clock, ShieldCheck, AlertCircle, CircleAlert } from "lucide-react";

type FreshnessLevel = "fresh" | "aging" | "stale";
type ConfidenceLevel = "Verified" | "Estimated" | "Needs Update";

function getFreshness(lastUpdated: string | Date): FreshnessLevel {
  const updated = new Date(lastUpdated);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return "fresh";
  if (diffDays <= 90) return "aging";
  return "stale";
}

function getConfidence(lastUpdated: string | Date, hasSource: boolean): ConfidenceLevel {
  const freshness = getFreshness(lastUpdated);
  if (freshness === "fresh" && hasSource) return "Verified";
  if (freshness === "aging") return "Estimated";
  return "Needs Update";
}

const FRESHNESS_CONFIG: Record<FreshnessLevel, { color: string; bg: string; border: string; label: string }> = {
  fresh: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Current" },
  aging: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Review Soon" },
  stale: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Outdated" },
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { color: string; bg: string; icon: typeof ShieldCheck }> = {
  Verified: { color: "text-emerald-700", bg: "bg-emerald-50", icon: ShieldCheck },
  Estimated: { color: "text-amber-700", bg: "bg-amber-50", icon: AlertCircle },
  "Needs Update": { color: "text-red-700", bg: "bg-red-50", icon: CircleAlert },
};

export function FreshnessDot({ lastUpdated }: { lastUpdated: string | Date }) {
  const freshness = getFreshness(lastUpdated);
  const dotColor = freshness === "fresh" ? "bg-emerald-500" : freshness === "aging" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} title={FRESHNESS_CONFIG[freshness].label} />;
}

export function FreshnessBadge({ lastUpdated }: { lastUpdated: string | Date }) {
  const freshness = getFreshness(lastUpdated);
  const conf = FRESHNESS_CONFIG[freshness];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${conf.color} ${conf.bg} ${conf.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${freshness === "fresh" ? "bg-emerald-500" : freshness === "aging" ? "bg-amber-500" : "bg-red-500"}`} />
      {conf.label}
    </span>
  );
}

export function ConfidenceBadge({ lastUpdated, hasSource }: { lastUpdated: string | Date; hasSource: boolean }) {
  const confidence = getConfidence(lastUpdated, hasSource);
  const conf = CONFIDENCE_CONFIG[confidence];
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${conf.color} ${conf.bg}`}>
      <Icon className="w-2.5 h-2.5" />
      {confidence}
    </span>
  );
}

export function SourceLink({ url, label }: { url: string; label?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
    >
      <ExternalLink className="w-3 h-3" />
      {label || "View Official Source"}
    </a>
  );
}

export function DataTransparencyFooter({ products }: {
  products: Array<{ lastUpdated: string | Date; sourceUrl?: string | null; institutionName: string }>;
}) {
  if (products.length === 0) return null;

  const latestDate = products.reduce((latest, p) => {
    const d = new Date(p.lastUpdated);
    return d > latest ? d : latest;
  }, new Date(0));

  const allHaveSources = products.every(p => !!p.sourceUrl);
  const freshness = getFreshness(latestDate);
  const confidence = getConfidence(latestDate, allHaveSources);
  const fConf = FRESHNESS_CONFIG[freshness];

  const sources = [...new Set(products.map(p => p.institutionName))];

  const formatted = latestDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mt-4 p-3 bg-muted/20 rounded-xl border border-border/30">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last Updated: <strong className="text-foreground">{formatted}</strong></span>
        </div>

        <FreshnessBadge lastUpdated={latestDate} />
        <ConfidenceBadge lastUpdated={latestDate} hasSource={allHaveSources} />

        <div className="text-xs text-muted-foreground">
          Source: {sources.join(", ")} official {sources.length === 1 ? "website" : "websites"}
        </div>
      </div>

      {allHaveSources && (
        <div className="flex flex-wrap gap-3 mt-2">
          {[...new Map(products.filter(p => p.sourceUrl).map(p => [p.institutionName, p])).values()].map(p => (
            <SourceLink key={p.institutionName} url={p.sourceUrl!} label={`${p.institutionName}`} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2 italic">
        Rates are indicative and subject to change. Please confirm with the respective bank for current rates and terms.
      </p>
    </div>
  );
}

export function ProductTransparencyBadge({ lastUpdated, sourceUrl, institutionName }: {
  lastUpdated: string | Date;
  sourceUrl?: string | null;
  institutionName: string;
}) {
  const formatted = new Date(lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <FreshnessDot lastUpdated={lastUpdated} />
      <span className="text-[10px] text-muted-foreground">{formatted}</span>
      <ConfidenceBadge lastUpdated={lastUpdated} hasSource={!!sourceUrl} />
      {sourceUrl && <SourceLink url={sourceUrl} label="Official Source" />}
    </div>
  );
}

import { useState } from "react";
import { useCalculateLoan, useGetLoanCalculations } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge } from "@/components/ui-elements";
import { Calculator, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight, Shield, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLoanCalculationsQueryKey } from "@workspace/api-client-react";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function EmiGauge({ emi, safeMin, safeMax }: { emi: number; safeMin: number; safeMax: number }) {
  const maxRange = safeMax * 1.6;
  const emiPct = Math.min(100, (emi / maxRange) * 100);
  const safeMinPct = (safeMin / maxRange) * 100;
  const safeMaxPct = (safeMax / maxRange) * 100;

  const getMarkerColor = () => {
    if (emi <= safeMin) return "bg-emerald-500";
    if (emi <= safeMax) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>Nu. 0</span>
        <span>{formatNu(Math.round(maxRange))}</span>
      </div>
      <div className="relative h-4 rounded-full overflow-hidden bg-muted/30">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-400/40 rounded-l-full"
          style={{ width: `${safeMinPct}%` }}
        />
        <div
          className="absolute inset-y-0 bg-amber-400/40"
          style={{ left: `${safeMinPct}%`, width: `${safeMaxPct - safeMinPct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-red-400/30 rounded-r-full"
          style={{ left: `${safeMaxPct}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg ${getMarkerColor()} transition-all duration-700`}
          style={{ left: `calc(${emiPct}% - 10px)` }}
        />
      </div>
      <div className="flex text-[11px] font-medium">
        <div style={{ width: `${safeMinPct}%` }} className="text-emerald-600 text-center">Safe</div>
        <div style={{ width: `${safeMaxPct - safeMinPct}%` }} className="text-amber-600 text-center">Stretching</div>
        <div className="flex-1 text-red-600 text-center">Risky</div>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: any }) {
  const statusConfig = {
    affordable: { label: "Affordable", color: "success" as const, icon: CheckCircle2, desc: "This loan fits comfortably within your budget." },
    stretching: { label: "Stretching", color: "warning" as const, icon: AlertTriangle, desc: "This loan is manageable but will tighten your budget." },
    unaffordable: { label: "Unaffordable", color: "destructive" as const, icon: AlertTriangle, desc: "This loan exceeds your safe repayment capacity." },
  };
  const status = statusConfig[result.affordabilityStatus as keyof typeof statusConfig] || statusConfig.unaffordable;
  const StatusIcon = status.icon;
  const impactNegative = result.healthScoreImpact < 0;

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-0 overflow-hidden border-none shadow-lg">
        <div className={`px-6 py-4 flex items-center justify-between gap-4 ${
          result.affordabilityStatus === "affordable" ? "bg-emerald-50" :
          result.affordabilityStatus === "stretching" ? "bg-amber-50" : "bg-red-50"
        }`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${
              result.affordabilityStatus === "affordable" ? "text-emerald-600" :
              result.affordabilityStatus === "stretching" ? "text-amber-600" : "text-red-600"
            }`} />
            <div>
              <h3 className="font-bold text-lg">{status.label}</h3>
              <p className="text-sm text-muted-foreground">{status.desc}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground font-medium mb-1">Monthly EMI</p>
            <p className="text-4xl font-display font-bold text-primary">{formatNu(result.emi)}</p>
            <p className="text-xs text-muted-foreground mt-1">per month for {result.tenureMonths} months</p>
          </div>

          <EmiGauge emi={result.emi} safeMin={result.safeEmiMin} safeMax={result.safeEmiMax} />

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 p-3 rounded-xl text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Loan Amount</p>
              <p className="text-sm font-bold">{formatNu(result.loanAmount)}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-xl text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Total Interest</p>
              <p className="text-sm font-bold text-amber-600">{formatNu(result.totalInterest)}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-xl text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Total Payment</p>
              <p className="text-sm font-bold">{formatNu(result.totalPayment)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-start gap-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${impactNegative ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
            <Target className={`w-5 h-5 ${impactNegative ? "text-red-600" : "text-emerald-600"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5">Health Score Impact</p>
            <p className={`text-2xl font-bold ${impactNegative ? "text-red-600" : "text-emerald-600"}`}>
              {result.healthScoreImpact > 0 ? "+" : ""}{result.healthScoreImpact} pts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {impactNegative ? "Your financial health score would decrease" : "Your score would remain stable"}
            </p>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl shrink-0 bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5">Safe EMI Range</p>
            <p className="text-lg font-bold text-primary">
              {formatNu(result.safeEmiMin)} – {formatNu(result.safeEmiMax)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">20–40% of your monthly income</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Loans() {
  const qc = useQueryClient();
  const { data: history } = useGetLoanCalculations();
  const calculateMutation = useCalculateLoan({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        qc.invalidateQueries({ queryKey: getGetLoanCalculationsQueryKey() });
      }
    }
  });

  const [formData, setFormData] = useState({
    loanAmount: "500000",
    interestRate: "9.5",
    tenureMonths: "60"
  });

  const [result, setResult] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate({
      data: {
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: parseInt(formData.tenureMonths, 10)
      }
    });
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Loan Calculator</h1>
        <p className="text-muted-foreground mt-1">Understand the real cost and impact before taking on new debt.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-6 self-start">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <div className="bg-primary/10 p-2 rounded-lg text-primary"><Calculator className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold">Loan Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Loan Amount (Nu.)</Label>
                <Input
                  type="number" required min="1000"
                  value={formData.loanAmount} onChange={e => setFormData({...formData, loanAmount: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Interest Rate (% p.a.)</Label>
                <Input
                  type="number" required min="0" step="0.1"
                  value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tenure (Months)</Label>
                <Input
                  type="number" required min="1"
                  value={formData.tenureMonths} onChange={e => setFormData({...formData, tenureMonths: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? "Calculating..." : "Calculate"}
              </Button>
            </form>
          </Card>

          {history && history.length > 0 && (
            <Card className="p-4">
              <h3 className="font-bold text-sm mb-3 px-1">Recent Calculations</h3>
              <div className="space-y-2">
                {history.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    className="w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/60 flex justify-between items-center transition-colors text-left"
                    onClick={() => setResult(item)}
                  >
                    <div>
                      <div className="font-semibold text-sm">{formatNu(item.loanAmount)}</div>
                      <div className="text-[11px] text-muted-foreground">{item.interestRate}% · {item.tenureMonths} mos</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{formatNu(item.emi)}/mo</div>
                      <Badge
                        variant={item.affordabilityStatus === "affordable" ? "success" : item.affordabilityStatus === "stretching" ? "warning" : "destructive"}
                        className="mt-0.5 text-[10px]"
                      >
                        {item.affordabilityStatus}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8">
          {result ? (
            <ResultPanel result={result} />
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[400px] border-dashed border-2 bg-transparent">
              <div className="p-4 bg-primary/10 rounded-2xl mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Enter Loan Details</h3>
              <p className="max-w-sm mb-5 leading-relaxed">Fill in the amount, interest rate, and tenure to see your monthly EMI, affordability verdict, safe EMI range, and how this loan would affect your health score.</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm w-full">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg mx-auto w-fit mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Affordable</p>
                  <p className="text-[10px] text-muted-foreground">EMI fits budget</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg mx-auto w-fit mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Stretching</p>
                  <p className="text-[10px] text-muted-foreground">Tight but doable</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <div className="p-1.5 bg-red-500/10 rounded-lg mx-auto w-fit mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Unaffordable</p>
                  <p className="text-[10px] text-muted-foreground">Exceeds capacity</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

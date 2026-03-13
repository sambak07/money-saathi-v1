import { useState } from "react";
import { useCalculateLoan, useGetLoanCalculations } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge } from "@/components/ui-elements";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLoanCalculationsQueryKey } from "@workspace/api-client-react";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Loan Calculator</h1>
        <p className="text-muted-foreground mt-1">Check affordability before taking on new debt.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 p-6 self-start">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><Calculator className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold">New Calculation</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Loan Amount (Nu.)</Label>
              <Input 
                type="number" required min="1000"
                value={formData.loanAmount} onChange={e => setFormData({...formData, loanAmount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (% p.a.)</Label>
              <Input 
                type="number" required min="0" step="0.1"
                value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Tenure (Months)</Label>
              <Input 
                type="number" required min="1"
                value={formData.tenureMonths} onChange={e => setFormData({...formData, tenureMonths: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full" disabled={calculateMutation.isPending}>
              {calculateMutation.isPending ? "Calculating..." : "Calculate EMI"}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-8 flex flex-col gap-6">
          {result ? (
            <Card className="p-8 border-none bg-gradient-to-br from-card to-accent/20 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold">Calculation Results</h2>
                  <p className="text-sm text-muted-foreground">Based on your current income and existing debts</p>
                </div>
                <Badge 
                  variant={result.affordabilityStatus === 'affordable' ? 'success' : result.affordabilityStatus === 'stretching' ? 'warning' : 'destructive'}
                  className="px-4 py-1.5 text-sm uppercase tracking-wider"
                >
                  {result.affordabilityStatus === 'affordable' && <CheckCircle2 className="w-4 h-4 mr-2 inline" />}
                  {result.affordabilityStatus !== 'affordable' && <AlertTriangle className="w-4 h-4 mr-2 inline" />}
                  {result.affordabilityStatus}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-background p-4 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Monthly EMI</div>
                  <div className="text-2xl font-bold text-primary">{formatNu(result.emi)}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Interest</div>
                  <div className="text-2xl font-bold text-amber-600">{formatNu(result.totalInterest)}</div>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Payment</div>
                  <div className="text-2xl font-bold">{formatNu(result.totalPayment)}</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-border/50 flex items-start gap-4">
                <div className="mt-1">
                  {result.healthScoreImpact < 0 ? (
                    <div className="bg-red-100 text-red-600 p-2 rounded-full"><AlertTriangle className="w-5 h-5" /></div>
                  ) : (
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full"><CheckCircle2 className="w-5 h-5" /></div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold">Health Score Impact</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Taking this loan would change your health score by <strong className={result.healthScoreImpact < 0 ? "text-red-600" : "text-emerald-600"}>{result.healthScoreImpact} points</strong>. 
                    {result.affordabilityStatus === 'unaffordable' 
                      ? " Your EMI exceeds the safe threshold based on your income." 
                      : " This is within your safe EMI capacity."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Safe EMI Limit: {formatNu(result.safeEmiMax)}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[300px] border-dashed border-2">
              <Calculator className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No calculation yet</h3>
              <p>Enter loan details on the left to see affordability analysis.</p>
            </Card>
          )}

          {history && history.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4">Recent Calculations</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {history.slice(0, 4).map((item) => (
                  <Card key={item.id} className="p-4 flex justify-between items-center cursor-pointer hover:border-primary transition-colors" onClick={() => setResult(item)}>
                    <div>
                      <div className="font-bold">{formatNu(item.loanAmount)}</div>
                      <div className="text-xs text-muted-foreground">{item.interestRate}% for {item.tenureMonths} mos</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">{formatNu(item.emi)}/mo</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{item.affordabilityStatus}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge, cn } from "@/components/ui-elements";
import { Modal } from "@/components/modal";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Wallet, Building2, User } from "lucide-react";
import { 
  useGetIncomeEntries, 
  useGetExpenseEntries, 
  useGetObligations, 
  useGetSavingsEntries 
} from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";

type TabType = "income" | "expenses" | "obligations" | "savings";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString()}`;
}

function useLabels() {
  const { user } = useAuth();
  const isBusiness = user?.profileType === "small_business";
  return {
    isBusiness,
    income: isBusiness ? "Revenue" : "Income",
    incomeSingle: isBusiness ? "Revenue Source" : "Income",
    incomeSource: isBusiness ? "Revenue Source" : "Source",
    expenses: isBusiness ? "Operating Expenses" : "Expenses",
    expenseSingle: isBusiness ? "Operating Expense" : "Expense",
    obligations: isBusiness ? "Business Loans" : "Personal Loans (Debt)",
    obligationSingle: isBusiness ? "Business Loan" : "Obligation",
    savings: isBusiness ? "Cash Balance & Reserves" : "Savings & Investments",
    savingsSingle: isBusiness ? "Cash Entry" : "Savings",
    pageTitle: isBusiness ? "Business Financial Data" : "Financial Data",
    pageSubtitle: isBusiness ? "Manage your revenue, expenses, loans, and reserves." : "Manage your cash flow, debts, and savings.",
  };
}

export default function DataEntry() {
  const [activeTab, setActiveTab] = useState<TabType>("income");
  const labels = useLabels();
  
  const { data: income } = useGetIncomeEntries();
  const { data: expenses } = useGetExpenseEntries();
  const { data: obligations } = useGetObligations();
  const { data: savings } = useGetSavingsEntries();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: "income", label: labels.income },
    { id: "expenses", label: labels.expenses },
    { id: "obligations", label: labels.obligations },
    { id: "savings", label: labels.savings },
  ];

  const addLabel = activeTab === "income" ? labels.incomeSingle
    : activeTab === "expenses" ? labels.expenseSingle
    : activeTab === "obligations" ? labels.obligationSingle
    : labels.savingsSingle;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-display font-bold text-foreground">{labels.pageTitle}</h1>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${labels.isBusiness ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                {labels.isBusiness ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {labels.isBusiness ? "Business" : "Individual"}
              </div>
            </div>
            <p className="text-muted-foreground mt-1">{labels.pageSubtitle}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add {addLabel}
          </Button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="p-0 overflow-hidden border-none shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-accent/30 text-muted-foreground font-medium border-b border-border">
                {activeTab === "income" && (
                  <tr>
                    <th className="px-6 py-4">{labels.incomeSource}</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Date Added</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "expenses" && (
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Date Added</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "obligations" && (
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Monthly EMI</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "savings" && (
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border">
                {activeTab === "income" && income?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.source}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 capitalize">{item.frequency.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="income" /></td>
                  </tr>
                ))}
                {activeTab === "expenses" && expenses?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.category}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 capitalize">{item.frequency.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="expenses" /></td>
                  </tr>
                ))}
                {activeTab === "obligations" && obligations?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 capitalize"><Badge variant="warning">{item.obligationType.replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4 font-bold">{formatNu(item.totalAmount)}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatNu(item.monthlyPayment)}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="obligations" /></td>
                  </tr>
                ))}
                {activeTab === "savings" && savings?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 capitalize"><Badge variant="success">{item.savingsType.replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4 text-primary font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="savings" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {((activeTab === 'income' && !income?.length) || 
              (activeTab === 'expenses' && !expenses?.length) || 
              (activeTab === 'obligations' && !obligations?.length) || 
              (activeTab === 'savings' && !savings?.length)) && (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">No records found</h3>
                <p className="text-muted-foreground">Add your first {addLabel.toLowerCase()} to get started.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <EntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={activeTab} labels={labels} />
    </Layout>
  );
}

function ItemActions({ id, type }: { id: number, type: TabType }) {
  const { deleteIncome, deleteExpense, deleteObligation, deleteSavings } = useFinanceMutations();
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this record?")) {
      if (type === "income") deleteIncome.mutate({ id });
      if (type === "expenses") deleteExpense.mutate({ id });
      if (type === "obligations") deleteObligation.mutate({ id });
      if (type === "savings") deleteSavings.mutate({ id });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={handleDelete}>
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function EntryModal({ isOpen, onClose, type, labels }: { isOpen: boolean, onClose: () => void, type: TabType, labels: ReturnType<typeof useLabels> }) {
  const { createIncome, createExpense, createObligation, createSavings } = useFinanceMutations();
  
  const [formData, setFormData] = useState<any>({
    frequency: 'monthly',
    obligationType: 'loan',
    savingsType: 'general'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount || 0), totalAmount: parseFloat(formData.totalAmount || 0), monthlyPayment: parseFloat(formData.monthlyPayment || 0) };
      
      if (type === "income") await createIncome.mutateAsync({ data: { source: payload.source, amount: payload.amount, frequency: payload.frequency } as any });
      if (type === "expenses") await createExpense.mutateAsync({ data: { category: payload.category, amount: payload.amount, frequency: payload.frequency } as any });
      if (type === "obligations") await createObligation.mutateAsync({ data: { name: payload.name, totalAmount: payload.totalAmount, monthlyPayment: payload.monthlyPayment, obligationType: payload.obligationType } as any });
      if (type === "savings") await createSavings.mutateAsync({ data: { name: payload.name, amount: payload.amount, savingsType: payload.savingsType } as any });
      
      onClose();
      setFormData({ frequency: 'monthly', obligationType: 'loan', savingsType: 'general' });
    } catch (err) {
      console.error(err);
    }
  };

  const isPending = createIncome.isPending || createExpense.isPending || createObligation.isPending || createSavings.isPending;

  const titles: Record<string, string> = {
    income: `Add ${labels.incomeSingle}`,
    expenses: `Add ${labels.expenseSingle}`,
    obligations: `Add ${labels.obligationSingle}`,
    savings: `Add ${labels.savingsSingle}`,
  };

  const sourcePlaceholder = labels.isBusiness
    ? (type === "income" ? "e.g., Product Sales, Consulting" : type === "expenses" ? "e.g., Rent, Payroll, Supplies" : "e.g., Working Capital Loan")
    : (type === "income" ? "e.g., Salary, Freelance" : type === "expenses" ? "e.g., Rent, Food, Utilities" : "e.g., Car Loan, Home Loan");

  const savingsTypes = labels.isBusiness
    ? [
        { value: "general", label: "Business Savings" },
        { value: "emergency_fund", label: "Operating Reserve" },
        { value: "investment", label: "Business Investment" },
        { value: "fixed_deposit", label: "Fixed Deposit" },
      ]
    : [
        { value: "general", label: "General Savings" },
        { value: "emergency_fund", label: "Emergency Fund" },
        { value: "investment", label: "Investment" },
        { value: "fixed_deposit", label: "Fixed Deposit" },
        { value: "retirement", label: "Retirement" },
      ];

  const obligationTypes = labels.isBusiness
    ? [
        { value: "loan", label: "Business Loan" },
        { value: "mortgage", label: "Property/Equipment Lease" },
        { value: "credit_card", label: "Business Credit Card" },
        { value: "other", label: "Other" },
      ]
    : [
        { value: "loan", label: "Personal/Business Loan" },
        { value: "mortgage", label: "Mortgage" },
        { value: "credit_card", label: "Credit Card" },
        { value: "other", label: "Other" },
      ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[type]}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {(type === "income" || type === "expenses" || type === "obligations" || type === "savings") && (
          <div className="space-y-2">
            <Label>{type === "income" ? labels.incomeSource : type === "expenses" ? "Category" : "Name"}</Label>
            <Input 
              required 
              value={formData[type === 'income' ? 'source' : type === 'expenses' ? 'category' : 'name'] || ''}
              onChange={e => setFormData({...formData, [type === 'income' ? 'source' : type === 'expenses' ? 'category' : 'name']: e.target.value})}
              placeholder={sourcePlaceholder} 
            />
          </div>
        )}

        {(type === "income" || type === "expenses" || type === "savings") && (
          <div className="space-y-2">
            <Label>Amount (Nu.)</Label>
            <Input 
              type="number" required min="0" step="0.01"
              value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})}
            />
          </div>
        )}

        {type === "obligations" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input type="number" required min="0" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Monthly EMI</Label>
                <Input type="number" required min="0" value={formData.monthlyPayment || ''} onChange={e => setFormData({...formData, monthlyPayment: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select 
                className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
                value={formData.obligationType} onChange={e => setFormData({...formData, obligationType: e.target.value})}
              >
                {obligationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </>
        )}

        {(type === "income" || type === "expenses") && (
          <div className="space-y-2">
            <Label>Frequency</Label>
            <select 
              className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
              value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One Time</option>
            </select>
          </div>
        )}

        {type === "savings" && (
          <div className="space-y-2">
            <Label>Type</Label>
            <select 
              className="flex h-12 w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
              value={formData.savingsType} onChange={e => setFormData({...formData, savingsType: e.target.value})}
            >
              {savingsTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Record"}</Button>
        </div>
      </form>
    </Modal>
  );
}

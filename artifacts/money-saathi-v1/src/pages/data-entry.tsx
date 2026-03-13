import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge, cn } from "@/components/ui-elements";
import { Modal } from "@/components/modal";
import { format } from "date-fns";
import { Plus, Trash2, Pencil, Wallet, Building2, User } from "lucide-react";
import {
  useGetIncomeEntries,
  useGetExpenseEntries,
  useGetObligations,
  useGetSavingsEntries
} from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import {
  INDIVIDUAL_INCOME_CATEGORIES, BUSINESS_INCOME_CATEGORIES,
  INDIVIDUAL_EXPENSE_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES,
  INDIVIDUAL_OBLIGATION_CATEGORIES, BUSINESS_OBLIGATION_CATEGORIES,
  INDIVIDUAL_SAVINGS_CATEGORIES, BUSINESS_SAVINGS_CATEGORIES,
  PAYMENT_MODES, OBLIGATION_PRIORITIES,
  SAVINGS_TYPES_INDIVIDUAL, SAVINGS_TYPES_BUSINESS,
  OBLIGATION_TYPES_INDIVIDUAL, OBLIGATION_TYPES_BUSINESS,
} from "@/lib/categories";

type TabType = "income" | "expenses" | "obligations" | "savings";

function formatNu(val: number) {
  return `Nu. ${val.toLocaleString()}`;
}

const selectClass = "flex h-11 w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors";

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
    obligations: isBusiness ? "Business Obligations" : "Long-Term Obligations",
    obligationSingle: isBusiness ? "Business Obligation" : "Obligation",
    savings: isBusiness ? "Business Reserves" : "Savings & Investments",
    savingsSingle: isBusiness ? "Reserve Entry" : "Savings Entry",
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
  const [editItem, setEditItem] = useState<any>(null);

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

  const openAdd = () => { setEditItem(null); setIsModalOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setIsModalOpen(true); };
  const closeModal = () => { setEditItem(null); setIsModalOpen(false); };

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
          <Button onClick={openAdd} className="gap-2 shrink-0">
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
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">{labels.incomeSource}</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "expenses" && (
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Frequency</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "obligations" && (
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Lender</th>
                    <th className="px-6 py-4">Outstanding</th>
                    <th className="px-6 py-4">Monthly EMI</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "savings" && (
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Institution</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Monthly</th>
                    <th className="px-6 py-4">Goal</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border">
                {activeTab === "income" && income?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.category || item.source}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.source}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 capitalize">{item.frequency.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.date || format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="income" item={item} onEdit={openEdit} /></td>
                  </tr>
                ))}
                {activeTab === "expenses" && expenses?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.category}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 capitalize">{item.frequency.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(item as any).paymentMode || "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(item as any).date || format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="expenses" item={item} onEdit={openEdit} /></td>
                  </tr>
                ))}
                {activeTab === "obligations" && obligations?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{(item as any).category || item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.name}</td>
                    <td className="px-6 py-4 font-bold">{formatNu(item.totalAmount)}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatNu(item.monthlyPayment)}</td>
                    <td className="px-6 py-4">{(item as any).priority ? <Badge variant={(item as any).priority === "high" ? "destructive" : "warning"}>{(item as any).priority}</Badge> : "—"}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="obligations" item={item} onEdit={openEdit} /></td>
                  </tr>
                ))}
                {activeTab === "savings" && savings?.map(item => (
                  <tr key={item.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 font-medium">{(item as any).category || item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(item as any).institution || "—"}</td>
                    <td className="px-6 py-4 text-primary font-bold">{formatNu(item.amount)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(item as any).monthlyContribution ? formatNu((item as any).monthlyContribution) : "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{(item as any).linkedGoal || "—"}</td>
                    <td className="px-6 py-4 text-right"><ItemActions id={item.id} type="savings" item={item} onEdit={openEdit} /></td>
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

      <EntryModal isOpen={isModalOpen} onClose={closeModal} type={activeTab} labels={labels} editItem={editItem} />
    </Layout>
  );
}

function ItemActions({ id, type, item, onEdit }: { id: number; type: TabType; item: any; onEdit: (item: any) => void }) {
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
    <div className="flex gap-1 justify-end">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8" onClick={() => onEdit({ ...item, _type: type })}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={handleDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function EntryModal({ isOpen, onClose, type, labels, editItem }: {
  isOpen: boolean; onClose: () => void; type: TabType;
  labels: ReturnType<typeof useLabels>; editItem: any;
}) {
  const { createIncome, updateIncome, createExpense, updateExpense, createObligation, updateObligation, createSavings, updateSavings } = useFinanceMutations();
  const isEdit = !!editItem;
  const editType = editItem?._type || type;

  const getDefaults = () => {
    if (editItem) {
      return { ...editItem };
    }
    return {
      frequency: 'monthly',
      obligationType: 'loan',
      savingsType: 'general',
      priority: '',
      paymentMode: '',
      category: '',
      note: '',
      date: '',
      source: '',
      name: '',
      amount: '',
      totalAmount: '',
      monthlyPayment: '',
      interestRate: '',
      institution: '',
      monthlyContribution: '',
      expectedReturn: '',
      startDate: '',
      endDate: '',
      nextDueDate: '',
      maturityDate: '',
      linkedGoal: '',
    };
  };

  const [formData, setFormData] = useState<any>(getDefaults);

  useEffect(() => {
    if (isOpen) {
      setFormData(getDefaults());
    }
  }, [isOpen, editItem]);

  const resetAndClose = () => {
    setFormData(getDefaults());
    onClose();
  };

  const set = (key: string, val: any) => setFormData((prev: any) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentType = isEdit ? editType : type;

      if (currentType === "income") {
        const payload: any = {
          source: formData.source || formData.category || "",
          category: formData.category || null,
          amount: parseFloat(formData.amount || 0),
          frequency: formData.frequency,
          date: formData.date || null,
          note: formData.note || null,
        };
        if (isEdit) {
          await updateIncome.mutateAsync({ id: editItem.id, data: payload });
        } else {
          await createIncome.mutateAsync({ data: payload });
        }
      }

      if (currentType === "expenses") {
        const payload: any = {
          category: formData.category,
          amount: parseFloat(formData.amount || 0),
          frequency: formData.frequency,
          date: formData.date || null,
          paymentMode: formData.paymentMode || null,
          note: formData.note || null,
        };
        if (isEdit) {
          await updateExpense.mutateAsync({ id: editItem.id, data: payload });
        } else {
          await createExpense.mutateAsync({ data: payload });
        }
      }

      if (currentType === "obligations") {
        const payload: any = {
          name: formData.name || formData.category || "",
          category: formData.category || null,
          totalAmount: parseFloat(formData.totalAmount || 0),
          monthlyPayment: parseFloat(formData.monthlyPayment || 0),
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
          obligationType: formData.obligationType,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          nextDueDate: formData.nextDueDate || null,
          priority: formData.priority || null,
          note: formData.note || null,
        };
        if (isEdit) {
          await updateObligation.mutateAsync({ id: editItem.id, data: payload });
        } else {
          await createObligation.mutateAsync({ data: payload });
        }
      }

      if (currentType === "savings") {
        const payload: any = {
          name: formData.name || formData.category || "",
          category: formData.category || null,
          amount: parseFloat(formData.amount || 0),
          savingsType: formData.savingsType,
          institution: formData.institution || null,
          monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : null,
          expectedReturn: formData.expectedReturn ? parseFloat(formData.expectedReturn) : null,
          startDate: formData.startDate || null,
          maturityDate: formData.maturityDate || null,
          linkedGoal: formData.linkedGoal || null,
          note: formData.note || null,
        };
        if (isEdit) {
          await updateSavings.mutateAsync({ id: editItem.id, data: payload });
        } else {
          await createSavings.mutateAsync({ data: payload });
        }
      }

      resetAndClose();
    } catch (err) {
      console.error(err);
    }
  };

  const isPending = createIncome.isPending || updateIncome.isPending ||
    createExpense.isPending || updateExpense.isPending ||
    createObligation.isPending || updateObligation.isPending ||
    createSavings.isPending || updateSavings.isPending;

  const currentType = isEdit ? editType : type;

  const titles: Record<string, string> = {
    income: `${isEdit ? "Edit" : "Add"} ${labels.incomeSingle}`,
    expenses: `${isEdit ? "Edit" : "Add"} ${labels.expenseSingle}`,
    obligations: `${isEdit ? "Edit" : "Add"} ${labels.obligationSingle}`,
    savings: `${isEdit ? "Edit" : "Add"} ${labels.savingsSingle}`,
  };

  const incomeCategories = labels.isBusiness ? BUSINESS_INCOME_CATEGORIES : INDIVIDUAL_INCOME_CATEGORIES;
  const expenseCategories = labels.isBusiness ? BUSINESS_EXPENSE_CATEGORIES : INDIVIDUAL_EXPENSE_CATEGORIES;
  const obligationCategories = labels.isBusiness ? BUSINESS_OBLIGATION_CATEGORIES : INDIVIDUAL_OBLIGATION_CATEGORIES;
  const savingsCategories = labels.isBusiness ? BUSINESS_SAVINGS_CATEGORIES : INDIVIDUAL_SAVINGS_CATEGORIES;
  const obligationTypes = labels.isBusiness ? OBLIGATION_TYPES_BUSINESS : OBLIGATION_TYPES_INDIVIDUAL;
  const savingsTypes = labels.isBusiness ? SAVINGS_TYPES_BUSINESS : SAVINGS_TYPES_INDIVIDUAL;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={titles[currentType]}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {currentType === "income" && (
          <>
            <Field label="Category">
              <select className={selectClass} required value={formData.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">Select category...</option>
                {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={labels.incomeSource + " Name"}>
              <Input required value={formData.source || ''} onChange={e => set('source', e.target.value)} placeholder="e.g., Company name, client" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (Nu.)">
                <Input type="number" required min="0" step="0.01" value={formData.amount || ''} onChange={e => set('amount', e.target.value)} />
              </Field>
              <Field label="Frequency">
                <select className={selectClass} value={formData.frequency} onChange={e => set('frequency', e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
                </select>
              </Field>
            </div>
            <Field label="Date (optional)">
              <Input type="date" value={formData.date || ''} onChange={e => set('date', e.target.value)} />
            </Field>
            <Field label="Note (optional)">
              <Input value={formData.note || ''} onChange={e => set('note', e.target.value)} placeholder="Any additional details..." />
            </Field>
          </>
        )}

        {currentType === "expenses" && (
          <>
            <Field label="Category">
              <select className={selectClass} required value={formData.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">Select category...</option>
                {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (Nu.)">
                <Input type="number" required min="0" step="0.01" value={formData.amount || ''} onChange={e => set('amount', e.target.value)} />
              </Field>
              <Field label="Frequency">
                <select className={selectClass} value={formData.frequency} onChange={e => set('frequency', e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
                </select>
              </Field>
            </div>
            <Field label="Payment Mode (optional)">
              <select className={selectClass} value={formData.paymentMode || ''} onChange={e => set('paymentMode', e.target.value)}>
                <option value="">Select payment mode...</option>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Date (optional)">
              <Input type="date" value={formData.date || ''} onChange={e => set('date', e.target.value)} />
            </Field>
            <Field label="Note (optional)">
              <Input value={formData.note || ''} onChange={e => set('note', e.target.value)} placeholder="Any additional details..." />
            </Field>
          </>
        )}

        {currentType === "obligations" && (
          <>
            <Field label="Category">
              <select className={selectClass} required value={formData.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">Select category...</option>
                {obligationCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Institution / Lender">
              <Input required value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g., BDB, BNBL" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Outstanding Amount">
                <Input type="number" required min="0" value={formData.totalAmount || ''} onChange={e => set('totalAmount', e.target.value)} />
              </Field>
              <Field label="Monthly EMI">
                <Input type="number" required min="0" value={formData.monthlyPayment || ''} onChange={e => set('monthlyPayment', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Interest Rate (%)">
                <Input type="number" min="0" step="0.01" value={formData.interestRate || ''} onChange={e => set('interestRate', e.target.value)} />
              </Field>
              <Field label="Type">
                <select className={selectClass} value={formData.obligationType} onChange={e => set('obligationType', e.target.value)}>
                  {obligationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Start Date">
                <Input type="date" value={formData.startDate || ''} onChange={e => set('startDate', e.target.value)} />
              </Field>
              <Field label="End Date">
                <Input type="date" value={formData.endDate || ''} onChange={e => set('endDate', e.target.value)} />
              </Field>
              <Field label="Next Due">
                <Input type="date" value={formData.nextDueDate || ''} onChange={e => set('nextDueDate', e.target.value)} />
              </Field>
            </div>
            <Field label="Priority">
              <select className={selectClass} value={formData.priority || ''} onChange={e => set('priority', e.target.value)}>
                <option value="">Select priority...</option>
                {OBLIGATION_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Note (optional)">
              <Input value={formData.note || ''} onChange={e => set('note', e.target.value)} placeholder="Any additional details..." />
            </Field>
          </>
        )}

        {currentType === "savings" && (
          <>
            <Field label="Category">
              <select className={selectClass} required value={formData.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">Select category...</option>
                {savingsCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className={selectClass} value={formData.savingsType} onChange={e => set('savingsType', e.target.value)}>
                {savingsTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Institution (optional)">
              <Input value={formData.institution || ''} onChange={e => set('institution', e.target.value)} placeholder="e.g., BOB, BNBL, RICB" />
            </Field>
            <Field label="Name / Description">
              <Input required value={formData.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g., My Emergency Fund" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current Amount (Nu.)">
                <Input type="number" required min="0" step="0.01" value={formData.amount || ''} onChange={e => set('amount', e.target.value)} />
              </Field>
              <Field label="Monthly Contribution">
                <Input type="number" min="0" step="0.01" value={formData.monthlyContribution || ''} onChange={e => set('monthlyContribution', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expected Return (%)">
                <Input type="number" min="0" step="0.01" value={formData.expectedReturn || ''} onChange={e => set('expectedReturn', e.target.value)} />
              </Field>
              <Field label="Linked Goal">
                <Input value={formData.linkedGoal || ''} onChange={e => set('linkedGoal', e.target.value)} placeholder="e.g., House, Retirement" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <Input type="date" value={formData.startDate || ''} onChange={e => set('startDate', e.target.value)} />
              </Field>
              <Field label="Maturity Date">
                <Input type="date" value={formData.maturityDate || ''} onChange={e => set('maturityDate', e.target.value)} />
              </Field>
            </div>
            <Field label="Note (optional)">
              <Input value={formData.note || ''} onChange={e => set('note', e.target.value)} placeholder="Any additional details..." />
            </Field>
          </>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Update Record" : "Save Record"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

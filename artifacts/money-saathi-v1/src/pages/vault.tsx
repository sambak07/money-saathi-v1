import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import {
  Lock, Plus, Pencil, Trash2, Save, X, Building2, PiggyBank,
  CreditCard, Shield, TrendingUp, Bell, AlertTriangle, Clock, CheckCircle, Info
} from "lucide-react";

type Tab = "accounts" | "deposits" | "loans" | "insurance" | "investments";

interface BankAccount {
  id: number;
  institution: string;
  accountNickname: string;
  accountType: string;
  maskedAccountNumber?: string | null;
  notes?: string | null;
}

interface FixedDeposit {
  id: number;
  institution: string;
  depositAmount: number;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  notes?: string | null;
}

interface Loan {
  id: number;
  bank: string;
  loanType: string;
  outstandingAmount: number;
  emi: number;
  interestRate: string;
  remainingTenure: string;
  notes?: string | null;
}

interface Insurance {
  id: number;
  insurer: string;
  policyType: string;
  premiumAmount: number;
  premiumDueDate: string;
  notes?: string | null;
}

interface Investment {
  id: number;
  investmentType: string;
  institution: string;
  amount: number;
  notes?: string | null;
}

interface Reminder {
  type: string;
  title: string;
  date: string;
  description: string;
  urgency: string;
}

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "accounts", label: "Bank Accounts", icon: Building2 },
  { id: "deposits", label: "Fixed Deposits", icon: PiggyBank },
  { id: "loans", label: "Loans", icon: CreditCard },
  { id: "insurance", label: "Insurance", icon: Shield },
  { id: "investments", label: "Investments", icon: TrendingUp },
];

const BHUTAN_BANKS = [
  "Bank of Bhutan", "Bhutan National Bank", "Bhutan Development Bank",
  "T Bank", "Druk PNB", "NPPF",
];

function formatCurrency(n: number) {
  return `Nu. ${n.toLocaleString("en-IN")}`;
}

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/vault/${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

function EmptyState({ icon: Icon, message, onAdd }: { icon: typeof Building2; message: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
        <Plus className="h-4 w-4" /> Add Entry
      </button>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-destructive">Delete?</span>
      <button onClick={onConfirm} className="text-xs px-2 py-1 bg-destructive text-white rounded-lg hover:bg-destructive/90">Yes</button>
      <button onClick={onCancel} className="text-xs px-2 py-1 bg-muted rounded-lg hover:bg-muted/80">No</button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-border/50 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-destructive"> *</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border/50 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        className="w-full px-3 py-2 text-sm border border-border/50 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none" />
    </div>
  );
}

function BankAccountsSection() {
  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ institution: "", accountNickname: "", accountType: "", maskedAccountNumber: "", notes: "" });

  const load = useCallback(async () => { setLoading(true); const d = await api("bank-accounts"); setItems(d); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.institution || !form.accountNickname || !form.accountType) return;
    if (editing) {
      await api(`bank-accounts/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await api("bank-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setEditing(null); setAdding(false); setForm({ institution: "", accountNickname: "", accountType: "", maskedAccountNumber: "", notes: "" }); load();
  };

  const startEdit = (item: BankAccount) => {
    setEditing(item.id); setAdding(false);
    setForm({ institution: item.institution, accountNickname: item.accountNickname, accountType: item.accountType, maskedAccountNumber: item.maskedAccountNumber || "", notes: item.notes || "" });
  };

  const del = async (id: number) => { await api(`bank-accounts/${id}`, { method: "DELETE" }); setDeleting(null); load(); };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!adding && !editing && items.length === 0) return <EmptyState icon={Building2} message="No bank accounts added yet. Start organizing your accounts." onAdd={() => setAdding(true)} />;

  return (
    <div className="space-y-4">
      {!adding && !editing && (
        <div className="flex justify-end">
          <button onClick={() => { setAdding(true); setForm({ institution: "", accountNickname: "", accountType: "", maskedAccountNumber: "", notes: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Account
          </button>
        </div>
      )}

      {(adding || editing) && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-4">{editing ? "Edit Account" : "New Bank Account"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Institution" value={form.institution} onChange={v => setForm({ ...form, institution: v })} options={BHUTAN_BANKS} required />
            <InputField label="Account Nickname" value={form.accountNickname} onChange={v => setForm({ ...form, accountNickname: v })} placeholder="e.g. Salary Account" required />
            <SelectField label="Account Type" value={form.accountType} onChange={v => setForm({ ...form, accountType: v })} options={["Savings", "Current", "Fixed Deposit", "Recurring Deposit"]} required />
            <InputField label="Masked Account Number" value={form.maskedAccountNumber} onChange={v => setForm({ ...form, maskedAccountNumber: v })} placeholder="e.g. XXXX-1234" />
          </div>
          <div className="mt-4">
            <TextareaField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Any additional details..." />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </Card>
      )}

      {items.map(item => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{item.accountNickname}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.institution} · {item.accountType}</p>
              {item.maskedAccountNumber && <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{item.maskedAccountNumber}</p>}
              {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {deleting === item.id ? (
                <DeleteConfirm onConfirm={() => del(item.id)} onCancel={() => setDeleting(null)} />
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function FixedDepositsSection() {
  const [items, setItems] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ institution: "", depositAmount: "", interestRate: "", startDate: "", maturityDate: "", notes: "" });

  const load = useCallback(async () => { setLoading(true); const d = await api("fixed-deposits"); setItems(d); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.institution || !form.depositAmount || !form.interestRate || !form.startDate || !form.maturityDate) return;
    const body = { ...form, depositAmount: parseFloat(form.depositAmount) };
    if (editing) {
      await api(`fixed-deposits/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await api("fixed-deposits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setEditing(null); setAdding(false); setForm({ institution: "", depositAmount: "", interestRate: "", startDate: "", maturityDate: "", notes: "" }); load();
  };

  const startEdit = (item: FixedDeposit) => {
    setEditing(item.id); setAdding(false);
    setForm({ institution: item.institution, depositAmount: String(item.depositAmount), interestRate: item.interestRate, startDate: item.startDate, maturityDate: item.maturityDate, notes: item.notes || "" });
  };

  const del = async (id: number) => { await api(`fixed-deposits/${id}`, { method: "DELETE" }); setDeleting(null); load(); };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!adding && !editing && items.length === 0) return <EmptyState icon={PiggyBank} message="No fixed deposits added yet. Track your FDs and maturity dates." onAdd={() => setAdding(true)} />;

  return (
    <div className="space-y-4">
      {!adding && !editing && (
        <div className="flex justify-end">
          <button onClick={() => { setAdding(true); setForm({ institution: "", depositAmount: "", interestRate: "", startDate: "", maturityDate: "", notes: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Fixed Deposit
          </button>
        </div>
      )}

      {(adding || editing) && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-4">{editing ? "Edit Fixed Deposit" : "New Fixed Deposit"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Institution" value={form.institution} onChange={v => setForm({ ...form, institution: v })} options={BHUTAN_BANKS} required />
            <InputField label="Deposit Amount (Nu.)" value={form.depositAmount} onChange={v => setForm({ ...form, depositAmount: v })} type="number" required />
            <InputField label="Interest Rate" value={form.interestRate} onChange={v => setForm({ ...form, interestRate: v })} placeholder="e.g. 8.5%" required />
            <InputField label="Start Date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} type="date" required />
            <InputField label="Maturity Date" value={form.maturityDate} onChange={v => setForm({ ...form, maturityDate: v })} type="date" required />
          </div>
          <div className="mt-4">
            <TextareaField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </Card>
      )}

      {items.map(item => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="h-4 w-4 text-primary" />
                <span className="font-semibold">{formatCurrency(item.depositAmount)}</span>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{item.interestRate}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.institution}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{new Date(item.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} → {new Date(item.maturityDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {deleting === item.id ? (
                <DeleteConfirm onConfirm={() => del(item.id)} onCancel={() => setDeleting(null)} />
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function LoansSection() {
  const [items, setItems] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ bank: "", loanType: "", outstandingAmount: "", emi: "", interestRate: "", remainingTenure: "", notes: "" });

  const load = useCallback(async () => { setLoading(true); const d = await api("loans"); setItems(d); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.bank || !form.loanType || !form.outstandingAmount || !form.emi || !form.interestRate || !form.remainingTenure) return;
    const body = { ...form, outstandingAmount: parseFloat(form.outstandingAmount), emi: parseFloat(form.emi) };
    if (editing) {
      await api(`loans/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await api("loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setEditing(null); setAdding(false); setForm({ bank: "", loanType: "", outstandingAmount: "", emi: "", interestRate: "", remainingTenure: "", notes: "" }); load();
  };

  const startEdit = (item: Loan) => {
    setEditing(item.id); setAdding(false);
    setForm({ bank: item.bank, loanType: item.loanType, outstandingAmount: String(item.outstandingAmount), emi: String(item.emi), interestRate: item.interestRate, remainingTenure: item.remainingTenure, notes: item.notes || "" });
  };

  const del = async (id: number) => { await api(`loans/${id}`, { method: "DELETE" }); setDeleting(null); load(); };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!adding && !editing && items.length === 0) return <EmptyState icon={CreditCard} message="No loans added yet. Track your loans, EMIs, and outstanding balances." onAdd={() => setAdding(true)} />;

  return (
    <div className="space-y-4">
      {!adding && !editing && (
        <div className="flex justify-end">
          <button onClick={() => { setAdding(true); setForm({ bank: "", loanType: "", outstandingAmount: "", emi: "", interestRate: "", remainingTenure: "", notes: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Loan
          </button>
        </div>
      )}

      {(adding || editing) && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-4">{editing ? "Edit Loan" : "New Loan"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Bank" value={form.bank} onChange={v => setForm({ ...form, bank: v })} options={BHUTAN_BANKS} required />
            <SelectField label="Loan Type" value={form.loanType} onChange={v => setForm({ ...form, loanType: v })} options={["Housing Loan", "Personal Loan", "Education Loan", "Vehicle Loan", "Business Loan", "Agriculture Loan"]} required />
            <InputField label="Outstanding Amount (Nu.)" value={form.outstandingAmount} onChange={v => setForm({ ...form, outstandingAmount: v })} type="number" required />
            <InputField label="EMI (Nu.)" value={form.emi} onChange={v => setForm({ ...form, emi: v })} type="number" required />
            <InputField label="Interest Rate" value={form.interestRate} onChange={v => setForm({ ...form, interestRate: v })} placeholder="e.g. 10%" required />
            <InputField label="Remaining Tenure" value={form.remainingTenure} onChange={v => setForm({ ...form, remainingTenure: v })} placeholder="e.g. 15 years" required />
          </div>
          <div className="mt-4">
            <TextareaField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </Card>
      )}

      {items.map(item => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="font-semibold">{item.loanType}</span>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{item.interestRate}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.bank}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span>Outstanding: <strong className="text-foreground">{formatCurrency(item.outstandingAmount)}</strong></span>
                <span>EMI: <strong className="text-foreground">{formatCurrency(item.emi)}</strong></span>
                <span>Tenure: <strong className="text-foreground">{item.remainingTenure}</strong></span>
              </div>
              {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {deleting === item.id ? (
                <DeleteConfirm onConfirm={() => del(item.id)} onCancel={() => setDeleting(null)} />
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InsuranceSection() {
  const [items, setItems] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ insurer: "", policyType: "", premiumAmount: "", premiumDueDate: "", notes: "" });

  const load = useCallback(async () => { setLoading(true); const d = await api("insurance"); setItems(d); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.insurer || !form.policyType || !form.premiumAmount || !form.premiumDueDate) return;
    const body = { ...form, premiumAmount: parseFloat(form.premiumAmount) };
    if (editing) {
      await api(`insurance/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await api("insurance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setEditing(null); setAdding(false); setForm({ insurer: "", policyType: "", premiumAmount: "", premiumDueDate: "", notes: "" }); load();
  };

  const startEdit = (item: Insurance) => {
    setEditing(item.id); setAdding(false);
    setForm({ insurer: item.insurer, policyType: item.policyType, premiumAmount: String(item.premiumAmount), premiumDueDate: item.premiumDueDate, notes: item.notes || "" });
  };

  const del = async (id: number) => { await api(`insurance/${id}`, { method: "DELETE" }); setDeleting(null); load(); };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!adding && !editing && items.length === 0) return <EmptyState icon={Shield} message="No insurance policies added yet. Track premiums and due dates." onAdd={() => setAdding(true)} />;

  return (
    <div className="space-y-4">
      {!adding && !editing && (
        <div className="flex justify-end">
          <button onClick={() => { setAdding(true); setForm({ insurer: "", policyType: "", premiumAmount: "", premiumDueDate: "", notes: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Policy
          </button>
        </div>
      )}

      {(adding || editing) && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-4">{editing ? "Edit Policy" : "New Insurance Policy"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Insurer" value={form.insurer} onChange={v => setForm({ ...form, insurer: v })} placeholder="e.g. Royal Insurance Corporation" required />
            <SelectField label="Policy Type" value={form.policyType} onChange={v => setForm({ ...form, policyType: v })} options={["Life Insurance", "Health Insurance", "Vehicle Insurance", "Property Insurance", "Travel Insurance", "Group Insurance"]} required />
            <InputField label="Premium Amount (Nu.)" value={form.premiumAmount} onChange={v => setForm({ ...form, premiumAmount: v })} type="number" required />
            <InputField label="Premium Due Date" value={form.premiumDueDate} onChange={v => setForm({ ...form, premiumDueDate: v })} type="date" required />
          </div>
          <div className="mt-4">
            <TextareaField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </Card>
      )}

      {items.map(item => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold">{item.policyType}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.insurer}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span>Premium: <strong className="text-foreground">{formatCurrency(item.premiumAmount)}</strong></span>
                <span>Due: <strong className="text-foreground">{new Date(item.premiumDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              </div>
              {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {deleting === item.id ? (
                <DeleteConfirm onConfirm={() => del(item.id)} onCancel={() => setDeleting(null)} />
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InvestmentsSection() {
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ investmentType: "", institution: "", amount: "", notes: "" });

  const load = useCallback(async () => { setLoading(true); const d = await api("investments"); setItems(d); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.investmentType || !form.institution || !form.amount) return;
    const body = { ...form, amount: parseFloat(form.amount) };
    if (editing) {
      await api(`investments/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await api("investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setEditing(null); setAdding(false); setForm({ investmentType: "", institution: "", amount: "", notes: "" }); load();
  };

  const startEdit = (item: Investment) => {
    setEditing(item.id); setAdding(false);
    setForm({ investmentType: item.investmentType, institution: item.institution, amount: String(item.amount), notes: item.notes || "" });
  };

  const del = async (id: number) => { await api(`investments/${id}`, { method: "DELETE" }); setDeleting(null); load(); };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!adding && !editing && items.length === 0) return <EmptyState icon={TrendingUp} message="No investments added yet. Track your portfolio in one place." onAdd={() => setAdding(true)} />;

  return (
    <div className="space-y-4">
      {!adding && !editing && (
        <div className="flex justify-end">
          <button onClick={() => { setAdding(true); setForm({ investmentType: "", institution: "", amount: "", notes: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Investment
          </button>
        </div>
      )}

      {(adding || editing) && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-4">{editing ? "Edit Investment" : "New Investment"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Investment Type" value={form.investmentType} onChange={v => setForm({ ...form, investmentType: v })} options={["Stocks", "Mutual Funds", "Government Bonds", "NPPF Contribution", "Real Estate", "Gold", "Other"]} required />
            <InputField label="Institution" value={form.institution} onChange={v => setForm({ ...form, institution: v })} placeholder="e.g. Royal Securities Exchange" required />
            <InputField label="Amount (Nu.)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} type="number" required />
          </div>
          <div className="mt-4">
            <TextareaField label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setAdding(false); setEditing(null); }} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </Card>
      )}

      {items.map(item => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">{item.investmentType}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.institution}</p>
              <p className="text-sm font-semibold mt-1">{formatCurrency(item.amount)}</p>
              {item.notes && <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              {deleting === item.id ? (
                <DeleteConfirm onConfirm={() => del(item.id)} onCancel={() => setDeleting(null)} />
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => setDeleting(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RemindersPanel() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("reminders").then(d => { setReminders(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (reminders.length === 0) return null;

  const urgencyConfig: Record<string, { bg: string; text: string; icon: typeof AlertTriangle }> = {
    overdue: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: AlertTriangle },
    high: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
    medium: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Bell },
    info: { bg: "bg-muted/30 border-border/50", text: "text-muted-foreground", icon: Info },
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Upcoming Reminders</h3>
        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{reminders.length}</span>
      </div>
      <div className="space-y-2">
        {reminders.map((r, i) => {
          const config = urgencyConfig[r.urgency] || urgencyConfig.info;
          const Icon = config.icon;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg}`}>
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${config.text}`}>{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
              </div>
              {r.date && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Vault() {
  const [tab, setTab] = useState<Tab>("accounts");

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Financial Vault</h1>
            <p className="text-sm text-muted-foreground">Your secure space to organize accounts, assets & obligations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Your data stays private. No full account numbers are required — use masked numbers (e.g. XXXX-1234) for your reference only.</p>
        </div>
      </div>

      <RemindersPanel />

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "accounts" && <BankAccountsSection />}
      {tab === "deposits" && <FixedDepositsSection />}
      {tab === "loans" && <LoansSection />}
      {tab === "insurance" && <InsuranceSection />}
      {tab === "investments" && <InvestmentsSection />}
    </Layout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui-elements";
import { Plus, Pencil, Trash2, Save, X, Database, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FreshnessBadge, ConfidenceBadge } from "@/components/data-transparency";

interface FinancialProduct {
  id: number;
  institutionName: string;
  productCategory: string;
  productName: string;
  interestRate: string | null;
  minimumBalance: string | null;
  tenure: string | null;
  fees: string | null;
  keyFeatures: string | null;
  sourceUrl: string | null;
  lastUpdated: string;
}

const CATEGORIES = [
  { value: "savings", label: "Savings Accounts" },
  { value: "fd", label: "Fixed Deposits" },
  { value: "housing", label: "Housing Loans" },
  { value: "personal", label: "Personal Loans" },
  { value: "education", label: "Education Loans" },
];

const EMPTY_FORM = {
  institutionName: "",
  productCategory: "savings",
  productName: "",
  interestRate: "",
  minimumBalance: "",
  tenure: "",
  fees: "",
  keyFeatures: "",
  sourceUrl: "",
};

export default function AdminFinancialProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<FinancialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/financial-products", { credentials: "include" });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center">
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="text-muted-foreground mt-2">This page requires administrator privileges.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const filtered = filterCategory === "all" ? products : products.filter(p => p.productCategory === filterCategory);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: FinancialProduct) => {
    setEditingId(p.id);
    setForm({
      institutionName: p.institutionName,
      productCategory: p.productCategory,
      productName: p.productName,
      interestRate: p.interestRate || "",
      minimumBalance: p.minimumBalance || "",
      tenure: p.tenure || "",
      fees: p.fees || "",
      keyFeatures: p.keyFeatures || "",
      sourceUrl: p.sourceUrl || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.institutionName || !form.productName) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/financial-products/${editingId}` : "/api/financial-products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        fetchProducts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/financial-products/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteConfirm(null);
    fetchProducts();
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Financial Products Admin</h1>
                <p className="text-sm text-muted-foreground">Manage Bhutan's financial product database</p>
              </div>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filterCategory === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map(c => {
            const count = products.filter(p => p.productCategory === c.value).length;
            return (
              <button
                key={c.value}
                onClick={() => setFilterCategory(c.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  filterCategory === c.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>

        {showForm && (
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Institution Name *</label>
                <input
                  value={form.institutionName}
                  onChange={e => updateField("institutionName", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Bank of Bhutan (BOB)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Product Category *</label>
                <select
                  value={form.productCategory}
                  onChange={e => updateField("productCategory", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Product Name *</label>
                <input
                  value={form.productName}
                  onChange={e => updateField("productName", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Savings Account"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Interest Rate</label>
                <input
                  value={form.interestRate}
                  onChange={e => updateField("interestRate", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 4.00% or 9.00% – 10.50%"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Minimum Balance</label>
                <input
                  value={form.minimumBalance}
                  onChange={e => updateField("minimumBalance", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Nu. 500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Tenure</label>
                <input
                  value={form.tenure}
                  onChange={e => updateField("tenure", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 20 years"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Fees</label>
                <input
                  value={form.fees}
                  onChange={e => updateField("fees", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 1% of loan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Source URL</label>
                <input
                  value={form.sourceUrl}
                  onChange={e => updateField("sourceUrl", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Key Features</label>
                <textarea
                  value={form.keyFeatures}
                  onChange={e => updateField("keyFeatures", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Key features and highlights..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.institutionName || !form.productName}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No products found. Add your first financial product above.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Institution</th>
                  <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Category</th>
                  <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Product</th>
                  <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Interest Rate</th>
                  <th className="text-left px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Data Status</th>
                  <th className="text-right px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 border-b border-border/30 font-semibold">{p.institutionName}</td>
                    <td className="px-4 py-3 border-b border-border/30">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {CATEGORIES.find(c => c.value === p.productCategory)?.label || p.productCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-border/30">{p.productName}</td>
                    <td className="px-4 py-3 border-b border-border/30 font-bold text-primary">{p.interestRate || "—"}</td>
                    <td className="px-4 py-3 border-b border-border/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <FreshnessBadge lastUpdated={p.lastUpdated} />
                          <ConfidenceBadge lastUpdated={p.lastUpdated} hasSource={!!p.sourceUrl} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-border/30 text-right">
                      {deleteConfirm === p.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-destructive mr-1">Delete?</span>
                          <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-muted rounded-lg text-xs font-semibold">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

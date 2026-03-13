import React, { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, Send, X, CheckCircle } from "lucide-react";
import { cn } from "./ui-elements";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ confused: "", liked: "", improve: "", email: "" });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.confused && !form.liked && !form.improve) {
      setError("Please fill in at least one field.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send feedback");
      }
      setSubmitted(true);
      setForm({ confused: "", liked: "", improve: "", email: "" });
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => setSubmitted(false), 300);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute bottom-16 right-0 w-[340px] sm:w-[380px] bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-4 duration-200"
          )}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-display font-bold text-lg text-foreground">Send Feedback</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close feedback"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {submitted ? (
            <div className="px-5 pb-6 pt-4 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-foreground">Thank you!</p>
              <p className="text-sm text-muted-foreground">Your feedback helps us improve Money Saathi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">What confused you?</label>
                <textarea
                  value={form.confused}
                  onChange={(e) => setForm({ ...form, confused: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Anything unclear or hard to find..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">What did you like?</label>
                <textarea
                  value={form.liked}
                  onChange={(e) => setForm({ ...form, liked: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Features or parts that worked well..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">What should improve?</label>
                <textarea
                  value={form.improve}
                  onChange={(e) => setForm({ ...form, improve: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Suggestions or ideas..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Email <span className="font-normal text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="your@email.bt"
                  autoComplete="email"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => { setOpen(!open); setError(""); }}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
          open
            ? "bg-muted text-muted-foreground shadow-md"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30"
        )}
        aria-label="Send feedback"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
      </button>
    </div>
  );
}

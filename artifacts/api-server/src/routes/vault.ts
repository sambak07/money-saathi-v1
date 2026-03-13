import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, lte } from "drizzle-orm";
import {
  db,
  vaultBankAccountsTable,
  vaultFixedDepositsTable,
  vaultLoansTable,
  vaultInsuranceTable,
  vaultInvestmentsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(req: Request): number | null {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

function crudRoutes<T extends Record<string, any>>(
  basePath: string,
  table: any,
  validateBody: (body: any) => { success: boolean; data?: any; error?: string },
) {
  router.get(basePath, requireAuth, async (req: Request, res: Response): Promise<void> => {
    const rows = await db.select().from(table).where(eq(table.userId, req.userId!));
    res.json(rows);
  });

  router.post(basePath, requireAuth, async (req: Request, res: Response): Promise<void> => {
    const v = validateBody(req.body);
    if (!v.success) { res.status(400).json({ message: v.error }); return; }
    const [row] = await db.insert(table).values({ ...v.data, userId: req.userId! }).returning();
    res.status(201).json(row);
  });

  router.put(`${basePath}/:id`, requireAuth, async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req);
    if (!id) { res.status(400).json({ message: "Invalid id" }); return; }
    const v = validateBody(req.body);
    if (!v.success) { res.status(400).json({ message: v.error }); return; }
    const [row] = await db.update(table).set({ ...v.data, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.userId, req.userId!))).returning();
    if (!row) { res.status(404).json({ message: "Not found" }); return; }
    res.json(row);
  });

  router.delete(`${basePath}/:id`, requireAuth, async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req);
    if (!id) { res.status(400).json({ message: "Invalid id" }); return; }
    const [row] = await db.delete(table).where(and(eq(table.id, id), eq(table.userId, req.userId!))).returning();
    if (!row) { res.status(404).json({ message: "Not found" }); return; }
    res.json({ message: "Deleted" });
  });
}

function requireFields(body: any, fields: string[]): { success: boolean; data?: any; error?: string } {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length > 0) return { success: false, error: `Missing required fields: ${missing.join(", ")}` };
  const data: any = {};
  for (const key of Object.keys(body)) { data[key] = body[key]; }
  return { success: true, data };
}

crudRoutes("/vault/bank-accounts", vaultBankAccountsTable, (body) =>
  requireFields(body, ["institution", "accountNickname", "accountType"])
);

crudRoutes("/vault/fixed-deposits", vaultFixedDepositsTable, (body) =>
  requireFields(body, ["institution", "depositAmount", "interestRate", "startDate", "maturityDate"])
);

crudRoutes("/vault/loans", vaultLoansTable, (body) =>
  requireFields(body, ["bank", "loanType", "outstandingAmount", "emi", "interestRate", "remainingTenure"])
);

crudRoutes("/vault/insurance", vaultInsuranceTable, (body) =>
  requireFields(body, ["insurer", "policyType", "premiumAmount", "premiumDueDate"])
);

crudRoutes("/vault/investments", vaultInvestmentsTable, (body) =>
  requireFields(body, ["investmentType", "institution", "amount"])
);

router.get("/vault/reminders", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dateStr = thirtyDaysFromNow.toISOString().split("T")[0];

  const [fds, insurance, loans] = await Promise.all([
    db.select().from(vaultFixedDepositsTable)
      .where(and(eq(vaultFixedDepositsTable.userId, req.userId!), lte(vaultFixedDepositsTable.maturityDate, dateStr))),
    db.select().from(vaultInsuranceTable)
      .where(and(eq(vaultInsuranceTable.userId, req.userId!), lte(vaultInsuranceTable.premiumDueDate, dateStr))),
    db.select().from(vaultLoansTable)
      .where(eq(vaultLoansTable.userId, req.userId!)),
  ]);

  const reminders: { type: string; title: string; date: string; description: string; urgency: string }[] = [];

  for (const fd of fds) {
    const matDate = new Date(fd.maturityDate);
    const daysLeft = Math.ceil((matDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) {
      reminders.push({ type: "fd_maturity", title: `FD Matured — ${fd.institution}`, date: fd.maturityDate, description: `Your fixed deposit of Nu. ${fd.depositAmount.toLocaleString()} at ${fd.institution} has matured.`, urgency: "overdue" });
    } else {
      reminders.push({ type: "fd_maturity", title: `FD Maturing Soon — ${fd.institution}`, date: fd.maturityDate, description: `Your fixed deposit of Nu. ${fd.depositAmount.toLocaleString()} matures in ${daysLeft} days.`, urgency: daysLeft <= 7 ? "high" : "medium" });
    }
  }

  for (const ins of insurance) {
    const dueDate = new Date(ins.premiumDueDate);
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) {
      reminders.push({ type: "insurance_premium", title: `Premium Overdue — ${ins.insurer}`, date: ins.premiumDueDate, description: `${ins.policyType} premium of Nu. ${ins.premiumAmount.toLocaleString()} is overdue.`, urgency: "overdue" });
    } else {
      reminders.push({ type: "insurance_premium", title: `Premium Due — ${ins.insurer}`, date: ins.premiumDueDate, description: `${ins.policyType} premium of Nu. ${ins.premiumAmount.toLocaleString()} due in ${daysLeft} days.`, urgency: daysLeft <= 7 ? "high" : "medium" });
    }
  }

  for (const loan of loans) {
    reminders.push({ type: "loan_emi", title: `Monthly EMI — ${loan.bank}`, date: "", description: `${loan.loanType} EMI of Nu. ${loan.emi.toLocaleString()} due monthly. Outstanding: Nu. ${loan.outstandingAmount.toLocaleString()}.`, urgency: "info" });
  }

  reminders.sort((a, b) => {
    const urgencyOrder: Record<string, number> = { overdue: 0, high: 1, medium: 2, info: 3 };
    return (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4);
  });

  res.json(reminders);
});

export default router;

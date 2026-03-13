import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, expenseEntriesTable } from "@workspace/db";
import { CreateExpenseEntryBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { updateMonthlySnapshot } from "../lib/snapshotService";

const router: IRouter = Router();

router.get("/expenses", requireAuth, async (req, res): Promise<void> => {
  const entries = await db.select().from(expenseEntriesTable).where(eq(expenseEntriesTable.userId, req.userId!));
  res.json(entries);
});

router.post("/expenses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateExpenseEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
  const [entry] = await db.insert(expenseEntriesTable).values({ ...parsed.data, userId: req.userId! }).returning();
  updateMonthlySnapshot(req.userId!).catch(() => {});
  res.status(201).json(entry);
});

router.put("/expenses/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const parsed = CreateExpenseEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

  const [entry] = await db.update(expenseEntriesTable).set(parsed.data).where(and(eq(expenseEntriesTable.id, id), eq(expenseEntriesTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  updateMonthlySnapshot(req.userId!).catch(() => {});
  res.json(entry);
});

router.delete("/expenses/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const [entry] = await db.delete(expenseEntriesTable).where(and(eq(expenseEntriesTable.id, id), eq(expenseEntriesTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  updateMonthlySnapshot(req.userId!).catch(() => {});
  res.json({ message: "Deleted" });
});

export default router;

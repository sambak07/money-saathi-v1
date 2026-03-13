import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, incomeEntriesTable } from "@workspace/db";
import { CreateIncomeEntryBody, UpdateIncomeEntryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/income", requireAuth, async (req, res): Promise<void> => {
  const entries = await db.select().from(incomeEntriesTable).where(eq(incomeEntriesTable.userId, req.userId!));
  res.json(entries);
});

router.post("/income", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateIncomeEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(incomeEntriesTable).values({ ...parsed.data, userId: req.userId! }).returning();
  res.status(201).json(entry);
});

router.put("/income/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const parsed = CreateIncomeEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

  const [entry] = await db.update(incomeEntriesTable).set(parsed.data).where(and(eq(incomeEntriesTable.id, id), eq(incomeEntriesTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json(entry);
});

router.delete("/income/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const [entry] = await db.delete(incomeEntriesTable).where(and(eq(incomeEntriesTable.id, id), eq(incomeEntriesTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, savingsTable } from "@workspace/db";
import { CreateSavingsEntryBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/savings", requireAuth, async (req, res): Promise<void> => {
  const entries = await db.select().from(savingsTable).where(eq(savingsTable.userId, req.userId!));
  res.json(entries);
});

router.post("/savings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSavingsEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
  const [entry] = await db.insert(savingsTable).values({ ...parsed.data, userId: req.userId! }).returning();
  res.status(201).json(entry);
});

router.put("/savings/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const parsed = CreateSavingsEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

  const [entry] = await db.update(savingsTable).set(parsed.data).where(and(eq(savingsTable.id, id), eq(savingsTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json(entry);
});

router.delete("/savings/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const [entry] = await db.delete(savingsTable).where(and(eq(savingsTable.id, id), eq(savingsTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;

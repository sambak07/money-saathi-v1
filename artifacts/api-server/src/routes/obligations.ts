import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, obligationsTable } from "@workspace/db";
import { CreateObligationBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/obligations", requireAuth, async (req, res): Promise<void> => {
  const entries = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, req.userId!));
  res.json(entries);
});

router.post("/obligations", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateObligationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }
  const [entry] = await db.insert(obligationsTable).values({ ...parsed.data, userId: req.userId! }).returning();
  res.status(201).json(entry);
});

router.put("/obligations/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const parsed = CreateObligationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.message }); return; }

  const [entry] = await db.update(obligationsTable).set(parsed.data).where(and(eq(obligationsTable.id, id), eq(obligationsTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json(entry);
});

router.delete("/obligations/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid id" }); return; }

  const [entry] = await db.delete(obligationsTable).where(and(eq(obligationsTable.id, id), eq(obligationsTable.userId, req.userId!))).returning();
  if (!entry) { res.status(404).json({ message: "Not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;

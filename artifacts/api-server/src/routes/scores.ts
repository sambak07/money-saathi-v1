import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, financialScoresTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { getFinancialSummary, calculateScore } from "../lib/financialEngine";

const router: IRouter = Router();

router.get("/scores", requireAuth, async (req, res): Promise<void> => {
  const [score] = await db
    .select()
    .from(financialScoresTable)
    .where(eq(financialScoresTable.userId, req.userId!))
    .orderBy(desc(financialScoresTable.calculatedAt))
    .limit(1);

  if (!score) {
    res.status(404).json({ message: "No score calculated yet" });
    return;
  }

  res.json(score);
});

router.post("/scores/calculate", requireAuth, async (req, res): Promise<void> => {
  const summary = await getFinancialSummary(req.userId!);
  const scoreData = calculateScore(summary);

  const [saved] = await db
    .insert(financialScoresTable)
    .values({ userId: req.userId!, ...scoreData })
    .returning();

  res.json(saved);
});

export default router;

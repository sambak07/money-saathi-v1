import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, feedbackTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.post("/feedback", requireAuth, async (req, res): Promise<void> => {
  const { confused, liked, improve, email } = req.body;

  if (!confused && !liked && !improve) {
    res.status(400).json({ message: "Please fill in at least one feedback field." });
    return;
  }

  const [entry] = await db
    .insert(feedbackTable)
    .values({
      userId: req.userId!,
      confused: confused || null,
      liked: liked || null,
      improve: improve || null,
      email: email || null,
    })
    .returning();

  res.json(entry);
});

router.get("/feedback", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt));

  res.json(entries);
});

export default router;

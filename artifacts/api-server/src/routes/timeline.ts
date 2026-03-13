import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, financialSnapshotsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/timeline", requireAuth, async (req, res): Promise<void> => {
  const snapshots = await db.select()
    .from(financialSnapshotsTable)
    .where(eq(financialSnapshotsTable.userId, req.userId!))
    .orderBy(asc(financialSnapshotsTable.month));

  res.json(snapshots);
});

export default router;

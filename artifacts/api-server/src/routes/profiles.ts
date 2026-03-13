import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { CreateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/profiles", requireAuth, async (req, res): Promise<void> => {
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, req.userId!));
  if (!profile) {
    res.status(404).json({ message: "Profile not found" });
    return;
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    profileType: profile.profileType,
    businessName: profile.businessName,
    currency: profile.currency,
    createdAt: profile.createdAt,
  });
});

router.post("/profiles", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { profileType, businessName, currency } = parsed.data;

  const [existing] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, req.userId!));

  let profile;
  if (existing) {
    [profile] = await db
      .update(userProfilesTable)
      .set({ profileType, businessName: businessName ?? null, currency: currency ?? "BTN" })
      .where(eq(userProfilesTable.userId, req.userId!))
      .returning();
  } else {
    [profile] = await db
      .insert(userProfilesTable)
      .values({ userId: req.userId!, profileType, businessName: businessName ?? null, currency: currency ?? "BTN" })
      .returning();
  }

  res.json({
    id: profile.id,
    userId: profile.userId,
    profileType: profile.profileType,
    businessName: profile.businessName,
    currency: profile.currency,
    createdAt: profile.createdAt,
  });
});

router.patch("/profiles/mode", requireAuth, async (req, res): Promise<void> => {
  const { mode } = req.body;
  if (mode !== "individual" && mode !== "small_business") {
    res.status(400).json({ message: "mode must be 'individual' or 'small_business'" });
    return;
  }

  const [existing] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, req.userId!));

  if (!existing) {
    const [profile] = await db
      .insert(userProfilesTable)
      .values({ userId: req.userId!, profileType: mode, currency: "BTN" })
      .returning();
    res.json({ profileType: profile.profileType, hasProfile: true });
    return;
  }

  const [profile] = await db
    .update(userProfilesTable)
    .set({ profileType: mode })
    .where(eq(userProfilesTable.userId, req.userId!))
    .returning();

  res.json({ profileType: profile.profileType, hasProfile: true });
});

export default router;

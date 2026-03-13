import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, userProfilesTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { createSessionToken, getCookieOptions } from "../lib/session";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, password: hashedPassword, name }).returning();

  const token = createSessionToken(user.id);
  res.cookie("session", token, getCookieOptions());

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    hasProfile: false,
    isAdmin: user.isAdmin,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id));

  const token = createSessionToken(user.id);
  res.cookie("session", token, getCookieOptions());

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    hasProfile: !!profile,
    profileType: profile?.profileType || null,
    isAdmin: user.isAdmin,
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id));

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    hasProfile: !!profile,
    profileType: profile?.profileType || null,
    isAdmin: user.isAdmin,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie("session", { path: "/" });
  res.json({ message: "Logged out" });
});

export default router;

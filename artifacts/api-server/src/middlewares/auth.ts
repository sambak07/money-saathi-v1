import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifySessionToken } from "../lib/session";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const userId = verifySessionToken(token);
  if (userId === null) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  req.userId = userId;
  next();
}

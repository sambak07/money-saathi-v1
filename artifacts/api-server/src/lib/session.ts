import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

export function createSessionToken(userId: number): string {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  const token = Buffer.from(payload).toString("base64url") + "." + hmac;
  return token;
}

export function verifySessionToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, hmac] = parts;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");

  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    return null;
  }

  try {
    const data = JSON.parse(payload);
    if (typeof data.userId !== "number") return null;
    return data.userId;
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

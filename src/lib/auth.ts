import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const COOKIE_NAME = "kmun_admin";
const MAX_AGE_S = 60 * 60 * 12; // 12 hours

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
const hmac = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");
const sha = (v: string) => crypto.createHash("sha256").update(v).digest();

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return crypto.timingSafeEqual(sha(input), sha(expected));
}

export function makeToken() {
  const payload = String(Date.now() + MAX_AGE_S * 1000);
  return `${payload}.${hmac(payload)}`;
}

function verifyToken(token?: string) {
  if (!token || !adminEnabled()) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = hmac(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(payload) > Date.now();
}

export async function isAdmin() {
  return verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

/** Use at the top of every admin API route: returns a response to send back, or null if allowed. */
export async function guard() {
  return (await isAdmin()) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};

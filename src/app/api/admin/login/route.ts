import { NextResponse } from "next/server";
import { adminEnabled, checkPassword, COOKIE_NAME, cookieOptions, makeToken } from "@/lib/auth";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "disabled" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 8) return NextResponse.json({ error: "rate" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    recent.push(now);
    attempts.set(ip, recent);
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), cookieOptions);
  return res;
}

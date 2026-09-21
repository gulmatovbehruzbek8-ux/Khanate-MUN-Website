import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { getSettings } from "@/lib/settings";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 45; // allow Google's script time to wake up

const TICKET_LABEL: Record<string, string> = {
  delegate: "Delegate",
  delegate_meal: "Delegate",
  observer: "Observer",
};

// Best-effort rate limit (per server instance): 5 submissions per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!(await getSettings()).registrationOpen) {
    return NextResponse.json({ error: "closed" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success and drop it.
  if (clean(body.hp_x9, 200)) {
    console.warn("[register] dropped a submission because the hidden trap field was filled");
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 80);
  const telegram = clean(body.telegram, 64).replace(/^https?:\/\/t\.me\//i, "@");
  const ticketKey = clean(body.ticket, 20);
  const committee = clean(body.committee, 60);

  const validTelegram = /^@?[A-Za-z0-9_]{3,32}$/.test(telegram);
  const tk = site.fees.find((f) => f.key === ticketKey);
  if (name.length < 2 || !validTelegram || !tk) {
    return NextResponse.json({ error: "fields" }, { status: 400 });
  }
  const settings = await getSettings();
  const fee = { key: tk.key, uzs: tk.key === "observer" ? settings.feeObserver : settings.feeDelegate };
  const knownCommittee = site.committees.some((c) => c.body === committee) ? committee : "";

  const row = [
    new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tashkent" }), // A: time (Tashkent)
    name, // B
    clean(body.school, 120), // C
    telegram.startsWith("@") ? telegram : `@${telegram}`, // D
    TICKET_LABEL[fee.key], // E
    String(fee.uzs), // F
    knownCommittee, // G
    clean(body.referral, 40), // H
    clean(body.lang, 2), // I
    "New", // J: status (organisers edit this in the sheet)
  ];

  const store = getStore();
  if (!store) {
    console.error("[register] no storage configured: check GOOGLE_SCRIPT_URL (a valid https .../exec address) and GOOGLE_SCRIPT_SECRET in Vercel");
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  try {
    await store.append(row);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register] failed to save registration", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

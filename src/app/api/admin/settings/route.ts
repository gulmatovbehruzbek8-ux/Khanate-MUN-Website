import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { DATA_TAG, getSettings } from "@/lib/settings";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 45; // allow Google's script time to wake up

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  let start: string | null = null;
  if (typeof body.nextSeasonStart === "string" && body.nextSeasonStart.trim()) {
    const ms = new Date(body.nextSeasonStart).getTime();
    if (Number.isNaN(ms)) return NextResponse.json({ error: "bad_date" }, { status: 400 });
    start = new Date(ms).toISOString();
  }
  const registrationOpen = body.registrationOpen === true;
  const fee = (v: unknown) => Math.round(Number(v));
  const feeDelegate = fee(body.feeDelegate);
  const feeObserver = fee(body.feeObserver);
  const badFee = (n: number) => !Number.isFinite(n) || n < 0 || n > 100_000_000;
  if (badFee(feeDelegate) || badFee(feeObserver)) return NextResponse.json({ error: "bad_fee" }, { status: 400 });

  try {
    await store.saveSettings({ nextSeasonStart: start, registrationOpen, feeDelegate, feeObserver });
    revalidateTag(DATA_TAG, { expire: 0 });
    revalidatePath("/", "layout"); // refresh the public pages right away
    return NextResponse.json({ ok: true, nextSeasonStart: start, registrationOpen, feeDelegate, feeObserver });
  } catch (err) {
    console.error("[admin] saving settings failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

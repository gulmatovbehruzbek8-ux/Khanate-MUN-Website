import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getStore, STATUSES, type Status } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 45; // allow Google's script time to wake up

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 500 });
  try {
    return NextResponse.json({ store: store.kind, registrations: await store.list() });
  } catch (err) {
    console.error("[admin] list failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const row = Number(body.row);
  const status = body.status as Status;
  if (!Number.isInteger(row) || row < 2 || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await store.setStatus(row, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] status update failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

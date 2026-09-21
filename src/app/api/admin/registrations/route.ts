import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getStore, STATUSES, type Status } from "@/lib/store";
import { codeFor } from "@/lib/referral";

export const runtime = "nodejs";
export const maxDuration = 45; // allow Google's script time to wake up

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 500 });
  try {
    const regs = (await store.list()).map((r) => ({ ...r, code: r.telegram ? codeFor(r.telegram) : "" }));
    return NextResponse.json({ store: store.kind, registrations: regs });
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

// Delete one registration ({row, time, telegram} - checked against the live row) or all of them ({all: true}).
export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return NextResponse.json({ error: "no_store" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.all === true) {
      await store.clearRegistrations();
      return NextResponse.json({ ok: true });
    }
    const row = Number(body.row);
    if (!Number.isInteger(row) || row < 2) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    const current = (await store.list()).find((r) => r.row === row);
    if (!current || current.time.trim() !== String(body.time ?? "").trim() || current.telegram.trim() !== String(body.telegram ?? "").trim()) {
      return NextResponse.json({ error: "changed" }, { status: 409 }); // sheet changed since the list was loaded
    }
    await store.deleteRows([row]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete failed", err);
    return NextResponse.json({ error: "server", detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

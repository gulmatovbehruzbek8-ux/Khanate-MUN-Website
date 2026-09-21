import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { DATA_TAG } from "@/lib/settings";
import { getTeam, resetTeam, sanitizeTeam, saveTeam } from "@/lib/team";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ team: await getTeam() });
}

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const team = sanitizeTeam(body?.team);
  if (!team.length) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await saveTeam(team);
    revalidateTag(DATA_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, team });
  } catch (err) {
    console.error("[admin] saving team failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

/** Forget the saved team so the built-in list shows again. */
export async function DELETE() {
  const denied = await guard();
  if (denied) return denied;
  try {
    await resetTeam();
    revalidateTag(DATA_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] resetting team failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

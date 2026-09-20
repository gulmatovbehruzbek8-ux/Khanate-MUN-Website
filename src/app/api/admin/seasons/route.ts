import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getSeasons, resetSeason, sanitizeSeason, saveSeason } from "@/lib/seasons";

export const runtime = "nodejs";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return NextResponse.json({ seasons: await getSeasons() });
}

export async function PUT(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const season = sanitizeSeason(body);
  if (!season) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await saveSeason(season);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, season });
  } catch (err) {
    console.error("[admin] saving season failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

/** Remove the saved version: built-in seasons go back to their defaults, new ones disappear. */
export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const hadDefault = await resetSeason(slug);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, hadDefault });
  } catch (err) {
    console.error("[admin] resetting season failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

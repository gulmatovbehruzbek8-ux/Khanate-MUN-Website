import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

// Serves photos uploaded while testing locally (no Vercel Blob). Not used in real deployments.
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = /^[A-Za-z0-9-]+\.(jpg|png|webp)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = fs.readFileSync(path.join(process.cwd(), ".data", "uploads", file));
    return new Response(data, { headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

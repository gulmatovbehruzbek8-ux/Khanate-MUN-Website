import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { guard } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB bodies; the browser shrinks photos first

function detect(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: "png", type: "image/png" };
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", type: "image/webp" };
  return null;
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_big" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detect(buf); // check the real bytes, not the file name or the browser's claim
  if (!kind) return NextResponse.json({ error: "bad_type" }, { status: 415 });

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`seasons/photo.${kind.ext}`, buf, {
        access: "public",
        addRandomSuffix: true,
        contentType: kind.type,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err) {
      console.error("[upload] Vercel Blob failed", err);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
  }

  if (process.env.NODE_ENV !== "production" || process.env.USE_DEV_STORE === "1") {
    const name = `${crypto.randomUUID()}.${kind.ext}`;
    const dir = path.join(process.cwd(), ".data", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buf);
    return NextResponse.json({ url: `/api/media/${name}` });
  }

  return NextResponse.json({ error: "storage" }, { status: 500 });
}

import { guard } from "@/lib/auth";
import { getStore, HEADERS } from "@/lib/store";
import { codeFor } from "@/lib/referral";

export const runtime = "nodejs";

// Excel would run cells that start with = + - @ as formulas, so those get a leading apostrophe.
// Telegram handles are validated at sign-up (letters, digits, underscore), so they may start with @.
const cell = (v: string | number, isHandle = false) => {
  let s = String(v);
  if (/^[=+\-\t\r]/.test(s) || (!isHandle && s.startsWith("@"))) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const store = getStore();
  if (!store) return new Response("No store configured", { status: 500 });
  const rows = await store.list();
  const lines = [[...HEADERS, "Own code"].map((h) => cell(h)).join(",")].concat(
    rows.map((r) =>
      [r.time, r.name, r.school, r.telegram, r.ticket, r.fee, r.committee, r.referral, r.lang, r.status, codeFor(r.telegram)]
        .map((v, i) => cell(v, i === 3))
        .join(","),
    ),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="khanatemun-registrations-${date}.csv"`,
    },
  });
}

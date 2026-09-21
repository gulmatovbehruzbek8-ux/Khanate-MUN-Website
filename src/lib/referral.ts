import { createHmac } from "node:crypto";

// No 0/O/1/I/L so codes are easy to read out and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "khanatemun-dev";

const handle = (telegram: string) => telegram.trim().replace(/^@/, "").toLowerCase();

/** Every registrant's own referral code, worked out from their Telegram username (nothing extra to store). */
export function codeFor(telegram: string): string {
  const h = createHmac("sha256", secret()).update(handle(telegram)).digest();
  let out = "";
  for (let i = 0; i < 5; i++) out += ALPHABET[h[i] % ALPHABET.length];
  return `KMUN-${out}`;
}

/** Cleans up what a person typed: "kmun 7k2p9" -> "KMUN-7K2P9". Returns "" for an empty box. */
export function normalizeCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!s) return "";
  const body = s.startsWith("KMUN") ? s.slice(4) : s;
  return `KMUN-${body}`;
}

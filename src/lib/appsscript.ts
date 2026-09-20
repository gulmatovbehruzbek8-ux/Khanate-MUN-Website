import { rowToRegistration, STATUSES, type Registration, type Settings, type Status, type Store } from "./types";

/**
 * Store backed by a Google Apps Script web app that lives inside the Sheet.
 * Needs no Google Cloud project or card. See google-apps-script/Code.gs and the README.
 */
export function appsScriptConfigured() {
  return Boolean(process.env.GOOGLE_SCRIPT_URL && process.env.GOOGLE_SCRIPT_SECRET);
}

async function call<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(process.env.GOOGLE_SCRIPT_URL as string, {
    method: "POST",
    cache: "no-store",
    redirect: "follow", // Apps Script answers with a redirect to the result
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, action, ...payload }),
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  let body: { ok?: boolean; data?: T; error?: string };
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script returned a non-JSON reply (HTTP ${res.status}). Is the web app deployed for "Anyone"? ${text.slice(0, 120)}`);
  }
  if (!body.ok) throw new Error(`Apps Script error: ${body.error ?? "unknown"}`);
  return body.data as T;
}

export const appsScriptStore: Store = {
  kind: "sheets",

  async append(row) {
    await call("append", { row });
  },

  async list(): Promise<Registration[]> {
    const rows = await call<string[][]>("list");
    return rows.map((cells, i) => rowToRegistration(cells, i + 2));
  },

  async setStatus(row: number, status: Status) {
    if (!Number.isInteger(row) || row < 2 || !STATUSES.includes(status)) throw new Error("Bad input");
    await call("setStatus", { row, status });
  },

  async getSettings(): Promise<Settings | null> {
    const map = await call<Record<string, string>>("getSettings");
    if (!Object.keys(map).length) return null;
    const num = (k: string) => (map[k] ? Number(map[k]) : NaN);
    return {
      nextSeasonStart: map.nextSeasonStart || null,
      registrationOpen: map.registrationOpen === "true",
      feeDelegate: num("feeDelegate"), // NaN when missing; getSettings() falls back to the default
      feeObserver: num("feeObserver"),
    };
  },

  async saveSettings(s) {
    await call("saveSettings", {
      values: {
        nextSeasonStart: s.nextSeasonStart ?? "",
        registrationOpen: String(s.registrationOpen),
        feeDelegate: String(s.feeDelegate),
        feeObserver: String(s.feeObserver),
      },
    });
  },

  async getContent() {
    return call<Record<string, string>>("getContent");
  },

  async setContent(key, value) {
    if (value !== null && value.length > 45000) throw new Error("Content too large for one cell");
    await call("setContent", { key, value });
  },
};

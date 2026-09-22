import { rowToRegistration, STATUSES, type Registration, type Settings, type Status, type Store } from "./types";

/**
 * Store backed by a Google Apps Script web app that lives inside the Sheet.
 * Needs no Google Cloud project or card. See google-apps-script/Code.gs and the README.
 */
/** The Web app URL, tolerant of stray spaces or quotes pasted around it. Null when it is not a usable https URL. */
function scriptUrl(): string | null {
  const raw = (process.env.GOOGLE_SCRIPT_URL ?? "").trim().replace(/^["']+|["']+$/g, "").trim();
  try {
    return new URL(raw).protocol === "https:" ? raw : null;
  } catch {
    return null;
  }
}

export function appsScriptConfigured() {
  if (!process.env.GOOGLE_SCRIPT_URL && !process.env.GOOGLE_SCRIPT_SECRET) return false;
  if (!scriptUrl()) {
    console.error(
      "[store] GOOGLE_SCRIPT_URL is set but is not a valid https address. It must look like https://script.google.com/macros/s/XXXX/exec (the Web app URL from Apps Script's Deploy dialog).",
    );
    return false;
  }
  return Boolean(process.env.GOOGLE_SCRIPT_SECRET);
}

// Google's script can take 10+ seconds on the first call after being idle. Public page reads fail fast (they are
// cached and fall back to the last good value); registrations and the admin table wait longer.
const SLOW_OK = new Set(["append", "setStatus", "saveSettings", "setContent", "list", "deleteRows", "clearRegistrations"]);

async function rawCall<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(scriptUrl() as string, {
    method: "POST",
    redirect: "follow", // Apps Script answers with a redirect to the result
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, action, ...payload }),
    signal: AbortSignal.timeout(SLOW_OK.has(action) ? 28000 : 8000),
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

// Apps Script can take a few seconds (especially the first call after a pause). Retry once on failure.
async function call<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  try {
    return await rawCall<T>(action, payload);
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    const isRead = action === "getSettings" || action === "getContent" || action === "list";
    if (!timedOut && isRead) {
      return rawCall<T>(action, payload); // reads are safe to repeat; writes and deletes are not
    }
    throw err;
  }
}

// Reads used by public pages are cached briefly, shared between concurrent requests, and fall back to the
// last good value if Google is slow, so a slow Sheet never blanks or delays the site.
const TTL = 30_000;
const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
async function cachedRead<T>(action: string): Promise<T> {
  const hit = cache.get(action);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  let p = inflight.get(action) as Promise<T> | undefined;
  if (!p) {
    p = call<T>(action)
      .then((v) => {
        cache.set(action, { at: Date.now(), value: v });
        return v;
      })
      .finally(() => inflight.delete(action));
    inflight.set(action, p);
  }
  try {
    return await p;
  } catch (err) {
    if (hit) return hit.value as T; // stale is better than nothing
    throw err;
  }
}
const forget = (...actions: string[]) => actions.forEach((a) => cache.delete(a));

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

  async deleteRows(rows: number[]) {
    await call("deleteRows", { rows });
  },

  async clearRegistrations() {
    await call("clearRegistrations");
  },

  async getSettings(): Promise<Settings | null> {
    const map = await cachedRead<Record<string, string>>("getSettings");
    if (!Object.keys(map).length) return null;
    const num = (k: string) => (map[k] ? Number(map[k]) : NaN);
    return {
      nextSeasonStart: map.nextSeasonStart || null,
      registrationOpen: map.registrationOpen === "true",
      feeDelegate: num("feeDelegate"), // NaN when missing; getSettings() falls back to the default
    };
  },

  async saveSettings(s) {
    forget("getSettings");
    await call("saveSettings", {
      values: {
        nextSeasonStart: s.nextSeasonStart ?? "",
        registrationOpen: String(s.registrationOpen),
        feeDelegate: String(s.feeDelegate),
      },
    });
  },

  async getContent() {
    return cachedRead<Record<string, string>>("getContent");
  },

  async setContent(key, value) {
    if (value !== null && value.length > 45000) throw new Error("Content too large for one cell");
    forget("getContent");
    await call("setContent", { key, value });
  },
};

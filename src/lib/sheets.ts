import { JWT } from "google-auth-library";
import { HEADERS, rowToRegistration, STATUSES, type Registration, type Settings, type Status, type Store } from "./types";

export function sheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY,
  );
}

const regTab = () => process.env.GOOGLE_SHEET_TAB || "Registrations";
const SETTINGS_TAB = "Settings";
const CONTENT_TAB = "Content";
const base = () => `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}`;

let jwt: JWT | null = null;
async function api<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  jwt ??= new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await jwt.getAccessToken();
  if (!token) throw new Error("Could not get a Google access token");
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const range = (tab: string, a1: string) => encodeURIComponent(`'${tab}'!${a1}`);

// Values are sent with valueInputOption=RAW, so Google stores them as plain text and never evaluates formulas.

// Make sure both tabs exist and the registrations tab has its header row (once per server instance).
let ready: Promise<void> | null = null;
function ensureTabs() {
  ready ??= (async () => {
    const meta = await api<{ sheets: { properties: { title: string } }[] }>(`${base()}?fields=sheets.properties.title`);
    const have = new Set(meta.sheets.map((s) => s.properties.title));
    const missing = [regTab(), SETTINGS_TAB, CONTENT_TAB].filter((t) => !have.has(t));
    if (missing.length) {
      await api(`${base()}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }),
      });
    }
    const head = await api<{ values?: string[][] }>(`${base()}/values/${range(regTab(), "A1:J1")}`);
    if (!head.values?.length) {
      await api(`${base()}/values/${range(regTab(), "A1:J1")}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [HEADERS] }),
      });
    }
    const sh = await api<{ values?: string[][] }>(`${base()}/values/${range(SETTINGS_TAB, "A1:B1")}`);
    if (!sh.values?.length) {
      await api(`${base()}/values/${range(SETTINGS_TAB, "A1:B1")}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [["key", "value"]] }),
      });
    }
    const ch = await api<{ values?: string[][] }>(`${base()}/values/${range(CONTENT_TAB, "A1:B1")}`);
    if (!ch.values?.length) {
      await api(`${base()}/values/${range(CONTENT_TAB, "A1:B1")}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [["key", "value"]] }),
      });
    }
  })().catch((e) => {
    ready = null; // retry next time
    throw e;
  });
  return ready;
}

async function regSheetId(): Promise<number> {
  const meta = await api<{ sheets: { properties: { sheetId: number; title: string } }[] }>(
    `${base()}?fields=sheets.properties(sheetId,title)`,
  );
  const found = meta.sheets.find((s) => s.properties.title === regTab());
  if (!found) throw new Error("Registrations tab not found");
  return found.properties.sheetId;
}

export const sheetsStore: Store = {
  kind: "sheets",

  async append(row) {
    await ensureTabs();
    await api(
      `${base()}/values/${range(regTab(), "A:J")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ values: [row] }) },
    );
  },

  async list(): Promise<Registration[]> {
    await ensureTabs();
    const data = await api<{ values?: string[][] }>(`${base()}/values/${range(regTab(), "A2:J")}`);
    return (data.values ?? []).map((cells, i) => rowToRegistration(cells, i + 2));
  },

  async setStatus(row: number, status: Status) {
    if (!Number.isInteger(row) || row < 2 || !STATUSES.includes(status)) throw new Error("Bad input");
    await ensureTabs();
    await api(`${base()}/values/${range(regTab(), `J${row}`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [[status]] }),
    });
  },

  async getSettings(): Promise<Settings | null> {
    await ensureTabs();
    const data = await api<{ values?: string[][] }>(`${base()}/values/${range(SETTINGS_TAB, "A2:B")}`);
    const map = new Map((data.values ?? []).map(([k, v]) => [k, v ?? ""]));
    if (!map.size) return null;
    const num = (k: string) => (map.get(k) ? Number(map.get(k)) : NaN);
    return {
      nextSeasonStart: map.get("nextSeasonStart") || null,
      registrationOpen: map.get("registrationOpen") === "true",
      feeDelegate: num("feeDelegate"), // NaN when missing; getSettings() falls back to the default
    };
  },

  async saveSettings(s) {
    await ensureTabs();
    await api(`${base()}/values/${range(SETTINGS_TAB, "A2:B4")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({
        values: [
          ["nextSeasonStart", s.nextSeasonStart ?? ""],
          ["registrationOpen", String(s.registrationOpen)],
          ["feeDelegate", String(s.feeDelegate)],
        ],
      }),
    });
  },

  async deleteRows(rows: number[]) {
    const clean = [...new Set(rows)].filter((r) => Number.isInteger(r) && r >= 2).sort((a, b) => b - a); // bottom first so numbers stay valid
    if (!clean.length) return;
    await ensureTabs();
    const sheetId = await regSheetId();
    await api(`${base()}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: clean.map((r) => ({
          deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: r - 1, endIndex: r } },
        })),
      }),
    });
  },

  async clearRegistrations() {
    await ensureTabs();
    const data = await api<{ values?: string[][] }>(`${base()}/values/${range(regTab(), "A2:A")}`);
    const n = data.values?.length ?? 0;
    if (!n) return;
    const sheetId = await regSheetId();
    await api(`${base()}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: n + 1 } } }],
      }),
    });
  },

  async getContent() {
    await ensureTabs();
    const data = await api<{ values?: string[][] }>(`${base()}/values/${range(CONTENT_TAB, "A2:B")}`);
    const out: Record<string, string> = {};
    for (const [k, v] of data.values ?? []) if (k && v) out[k] = v;
    return out;
  },

  async setContent(key, value) {
    if (value !== null && value.length > 45000) throw new Error("Content too large for one cell");
    await ensureTabs();
    const keys = await api<{ values?: string[][] }>(`${base()}/values/${range(CONTENT_TAB, "A2:A")}`);
    const idx = (keys.values ?? []).findIndex((r) => r[0] === key);
    if (idx >= 0) {
      await api(`${base()}/values/${range(CONTENT_TAB, `B${idx + 2}`)}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [[value ?? ""]] }),
      });
    } else if (value !== null) {
      await api(`${base()}/values/${range(CONTENT_TAB, "A:B")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
        method: "POST",
        body: JSON.stringify({ values: [[key, value]] }),
      });
    }
  },
};

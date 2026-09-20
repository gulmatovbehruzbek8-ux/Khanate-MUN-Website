import { appsScriptConfigured, appsScriptStore } from "./appsscript";
import { devStore } from "./devstore";
import { sheetsConfigured, sheetsStore } from "./sheets";
import type { Store } from "./types";

export * from "./types";

/** Google Sheets (service account, or the no-card Apps Script) when configured; a local JSON file for development/testing. */
export function getStore(): Store | null {
  if (sheetsConfigured()) return sheetsStore;
  if (appsScriptConfigured()) return appsScriptStore;
  if (process.env.NODE_ENV !== "production" || process.env.USE_DEV_STORE === "1") return devStore;
  return null;
}

import { site } from "@/content/site";
import { getStore } from "./store";
import type { Settings } from "./types";

export const defaultSettings = (): Settings => ({
  nextSeasonStart: site.nextSeason.startsAt,
  registrationOpen: site.nextSeason.registrationOpen,
  feeDelegate: site.fees[0].uzs,
  feeObserver: site.fees[1].uzs,
});

/** Settings saved from the admin panel win over the defaults in src/content/site.ts. */
export async function getSettings(): Promise<Settings> {
  try {
    const saved = await getStore()?.getSettings();
    if (!saved) return defaultSettings();
    const d = defaultSettings();
    // Older saved settings have no prices yet: fall back to the defaults for those.
    const fee = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fb);
    return { ...saved, feeDelegate: fee(saved.feeDelegate, d.feeDelegate), feeObserver: fee(saved.feeObserver, d.feeObserver) };
  } catch (err) {
    console.error("[settings] could not read saved settings, using defaults", err);
    return defaultSettings();
  }
}

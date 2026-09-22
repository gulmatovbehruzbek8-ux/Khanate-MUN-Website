import { site } from "@/content/site";
import { unstable_cache } from "next/cache";
import { getStore } from "./store";
import type { Settings } from "./types";

export const defaultSettings = (): Settings => ({
  nextSeasonStart: site.nextSeason.startsAt,
  registrationOpen: site.nextSeason.registrationOpen,
  feeDelegate: site.fees[0].uzs,
});

export const DATA_TAG = "kmun-data";

// Cached (and refreshed every 60 s, or right after an admin save) so public pages stay static and fast
// instead of waiting on Google for every visit.
const readSaved = unstable_cache(async () => (await getStore()?.getSettings()) ?? null, ["kmun-settings"], {
  revalidate: 3600,
  tags: [DATA_TAG],
});

/** Settings saved from the admin panel win over the defaults in src/content/site.ts. */
export async function getSettings(): Promise<Settings> {
  try {
    const saved = await readSaved();
    if (!saved) return defaultSettings();
    const d = defaultSettings();
    // Older saved settings have no prices yet: fall back to the defaults for those.
    const fee = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fb);
    return { ...saved, feeDelegate: fee(saved.feeDelegate, d.feeDelegate) };
  } catch (err) {
    console.error("[settings] could not read saved settings, using defaults", err);
    return defaultSettings();
  }
}

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { defaultSeasons, type Chair, type Committee, type L, type Season } from "@/content/seasons";
import { DATA_TAG } from "./settings";
import { getStore } from "./store";

// Saved season edits are cached for 60 s (and refreshed right after an admin save) so pages stay fast.
const readContent = unstable_cache(async () => (await getStore()?.getContent()) ?? {}, ["kmun-content"], {
  revalidate: 60,
  tags: [DATA_TAG],
});

const KEY = (slug: string) => `season:${slug}`;

/** Defaults from src/content/seasons.ts, replaced/extended by whatever the admin saved. Newest first. */
// cache() only de-duplicates within one page render; saved edits show up as soon as the page is regenerated.
export const getSeasons = cache(async (): Promise<Season[]> => {
  const map = new Map(defaultSeasons.map((s) => [s.slug, s]));
  try {
    const content = await readContent();
    for (const [key, raw] of Object.entries(content)) {
      if (!key.startsWith("season:")) continue;
      try {
        const s = sanitizeSeason(JSON.parse(raw));
        if (s) map.set(s.slug, s);
      } catch {
        /* ignore a broken row, keep the default */
      }
    }
  } catch (err) {
    console.error("[seasons] could not read saved content, using defaults", err);
  }
  return [...map.values()].sort((a, b) => b.number - a.number);
});

export async function getSeason(slug: string) {
  return (await getSeasons()).find((s) => s.slug === slug);
}

export async function findCommittee(slug: string) {
  for (const season of await getSeasons()) {
    const committee = season.committees.find((c) => c.slug === slug);
    if (committee) return { season, committee };
  }
  return null;
}

export async function saveSeason(season: Season) {
  const store = getStore();
  if (!store) throw new Error("No store configured");
  await store.setContent(KEY(season.slug), JSON.stringify(season));
}

/** Remove the admin's version so the built-in default (if any) shows again. Returns true if a default exists. */
export async function resetSeason(slug: string) {
  const store = getStore();
  if (!store) throw new Error("No store configured");
  await store.setContent(KEY(slug), null);
  return defaultSeasons.some((s) => s.slug === slug);
}

/* ---------- validation ---------- */

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const lang = (v: unknown, max = 300): L => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { en: str(o.en, max), uz: str(o.uz, max) };
};
const optLang = (v: unknown, max = 300): L | undefined => {
  const l = lang(v, max);
  return l.en || l.uz ? l : undefined;
};
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const rec = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function isSafeImageUrl(u: string) {
  return /^https:\/\/[^\s]+$/.test(u) || /^\/api\/media\/[A-Za-z0-9._-]+$/.test(u) || /^\/seasons\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/.test(u);
}

/** Accepts untrusted JSON and returns a clean Season, or null if it is unusable. */
export function sanitizeSeason(input: unknown): Season | null {
  const o = rec(input);
  const slug = str(o.slug, 40);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const number = Number(o.number);
  if (!Number.isInteger(number) || number < 1 || number > 999) return null;

  const usedSlugs = new Set<string>();
  const committees: Committee[] = arr(o.committees, 12).map((raw, i) => {
    const c = rec(raw);
    const body = lang(c.body, 120);
    let cslug = str(c.slug, 60);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cslug)) cslug = `${slug}-${slugify(body.en || `committee-${i + 1}`)}`;
    while (usedSlugs.has(cslug)) cslug += "-2";
    usedSlugs.add(cslug);
    const chairs: Chair[] = arr(c.chairs, 8)
      .map((ch) => rec(ch))
      .filter((ch) => str(ch.name, 80))
      .map((ch) => ({ role: ch.role === "co" ? ("co" as const) : ("head" as const), name: str(ch.name, 80) }));
    const cimages = arr(c.images, 20)
      .map((raw) => rec(raw))
      .filter((im) => isSafeImageUrl(str(im.url, 600)))
      .map((im) => ({ url: str(im.url, 600) }));
    return {
      slug: cslug,
      images: cimages.length ? cimages : undefined,
      body,
      agenda: lang(c.agenda, 300),
      about: lang(c.about, 800),
      language: optLang(c.language, 60),
      chairs: chairs.length ? chairs : undefined,
    };
  });

  const fees = arr(o.fees, 10).map((raw) => {
    const f = rec(raw);
    const uzs = Math.max(0, Math.min(100_000_000, Math.round(Number(f.uzs) || 0)));
    return { label: lang(f.label, 80), uzs, free: f.free === true ? true : undefined };
  });

  const keyDates = arr(o.keyDates, 10).map((raw) => {
    const k = rec(raw);
    return { label: lang(k.label, 100), date: lang(k.date, 60) };
  });

  const images = arr(o.images, 40)
    .map((raw) => rec(raw))
    .filter((im) => isSafeImageUrl(str(im.url, 600)))
    .map((im) => ({ url: str(im.url, 600), caption: optLang(im.caption, 200) }));

  return {
    slug,
    number,
    title: lang(o.title, 80),
    date: lang(o.date, 80),
    venue: lang(o.venue, 200),
    summary: lang(o.summary, 1500),
    fees,
    keyDates: keyDates.length ? keyDates : undefined,
    perks: arr(o.perks, 12).map((p) => lang(p, 300)),
    committees,
    images: images.length ? images : undefined,
  };
}

import type { MetadataRoute } from "next";
import { langs } from "@/lib/dictionaries";
import { getSeasons } from "@/lib/seasons";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const seasons = await getSeasons().catch(() => []);
  const pages = ["", "/about", "/seasons", "/committees", "/register", "/team", "/faq"];

  const entries: MetadataRoute.Sitemap = [];

  for (const p of pages) {
    for (const lang of langs) {
      entries.push({
        url: `${base}/${lang}${p}`,
        lastModified: new Date(),
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1.0 : 0.8,
        alternates: {
          languages: {
            en: `${base}/en${p}`,
            uz: `${base}/uz${p}`,
            "x-default": `${base}/en${p}`,
          },
        },
      });
    }
  }

  for (const s of seasons) {
    for (const lang of langs) {
      entries.push({
        url: `${base}/${lang}/seasons/${s.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${base}/en/seasons/${s.slug}`,
            uz: `${base}/uz/seasons/${s.slug}`,
            "x-default": `${base}/en/seasons/${s.slug}`,
          },
        },
      });
    }

    for (const c of s.committees) {
      for (const lang of langs) {
        entries.push({
          url: `${base}/${lang}/committees/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: {
            languages: {
              en: `${base}/en/committees/${c.slug}`,
              uz: `${base}/uz/committees/${c.slug}`,
              "x-default": `${base}/en/committees/${c.slug}`,
            },
          },
        });
      }
    }
  }

  return entries;
}

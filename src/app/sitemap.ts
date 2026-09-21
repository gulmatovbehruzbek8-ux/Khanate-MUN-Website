import type { MetadataRoute } from "next";
import { langs } from "@/lib/dictionaries";
import { getSeasons } from "@/lib/seasons";

export const revalidate = 300;

const host = () =>
  process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = host();
  const seasons = await getSeasons().catch(() => []);
  const pages = ["", "/about", "/seasons", "/committees", "/register", "/team", "/faq"];
  return langs.flatMap((lang) => [
    ...pages.map((p) => ({ url: `${base}/${lang}${p}` })),
    ...seasons.map((s) => ({ url: `${base}/${lang}/seasons/${s.slug}` })),
    ...seasons.flatMap((s) => s.committees.map((c) => ({ url: `${base}/${lang}/committees/${c.slug}` }))),
  ]);
}

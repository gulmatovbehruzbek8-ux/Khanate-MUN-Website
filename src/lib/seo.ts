import type { Lang } from "./dictionaries";

export const SITE_URL = "https://khanate-mun-website.vercel.app";

/**
 * Returns canonical and hreflang alternate links for Next.js App Router metadata.
 *
 * @param lang - Current language ("en" | "uz")
 * @param path - Optional route pathname suffix, e.g. "/about" or "/committees/s2-ga". Use "" for homepage.
 */
export function getAlternates(lang: Lang, path: string = "") {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return {
    canonical: `/${lang}${cleanPath}`,
    languages: {
      en: `/en${cleanPath}`,
      uz: `/uz${cleanPath}`,
      "x-default": `/en${cleanPath}`,
    },
  };
}

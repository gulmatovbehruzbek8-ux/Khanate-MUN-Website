import type { MetadataRoute } from "next";

const host = () => "https://khanate-mun-website.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${host()}/sitemap.xml` };
}

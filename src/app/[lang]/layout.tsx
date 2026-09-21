import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "../globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Motion from "@/components/Motion";
import { langs } from "@/lib/dictionaries";
import { getDict, getLang } from "@/lib/i18n";

export const generateStaticParams = () => langs.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = await getLang(params);
  const host = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  const d = getDict(lang);
  return {
    metadataBase: new URL(host),
    openGraph: {
      type: "website",
      siteName: "KhanateMUN",
      title: "KhanateMUN",
      description: d.lead,
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "KhanateMUN, Model United Nations, Khiva" }],
    },
    twitter: { card: "summary_large_image", title: "KhanateMUN", description: d.lead, images: ["/og.jpg"] },
    title: { default: "KhanateMUN", template: "%s · KhanateMUN" },
    description: getDict(lang).lead,
    alternates: { languages: { en: "/en", uz: "/uz" } },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = await getLang(params);
  const dict = getDict(lang);
  return (
    <html lang={lang}>
      <body>
        <Nav lang={lang} dict={dict} />
        {children}
        <Footer dict={dict} lang={lang} />
        <Motion />
      </body>
    </html>
  );
}

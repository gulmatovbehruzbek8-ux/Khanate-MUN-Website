import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "../globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { langs } from "@/lib/dictionaries";
import { getDict, getLang } from "@/lib/i18n";

export const generateStaticParams = () => langs.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = await getLang(params);
  return {
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
        <Footer dict={dict} />
      </body>
    </html>
  );
}

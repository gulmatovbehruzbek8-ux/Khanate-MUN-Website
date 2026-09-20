import { notFound } from "next/navigation";
import { dictionaries, isLang, type Lang } from "./dictionaries";

export async function getLang(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

export const getDict = (lang: Lang) => dictionaries[lang];

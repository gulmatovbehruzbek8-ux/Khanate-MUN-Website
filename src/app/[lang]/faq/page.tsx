import type { Metadata } from "next";
import { faq } from "@/content/faq";
import { site } from "@/content/site";
import { getDict, getLang } from "@/lib/i18n";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = await getLang(params);
  const d = getDict(lang);
  return {
    title: d.n_faq,
    description: d.faq_p,
    alternates: getAlternates(lang, "/faq"),
  };
}

export default async function Faq({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  return (
    <section className="inner">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">{d.n_faq}</div>
          <h2>{d.faq_h}</h2>
          <p>{d.faq_p}</p>
        </div>
        <div className="faq">
          {faq.map((f, i) => (
            <details key={i}>
              <summary>{f.q[lang]}</summary>
              <p>{f.a[lang]}</p>
            </details>
          ))}
        </div>
        <div className="subhead">{d.contact_h}</div>
        <p style={{ color: "var(--mute)", margin: "0 0 16px" }}>{d.contact_p}</p>
        <div className="cta">
          <a className="btn" href={site.social.telegram}>{d.contact_tg}</a>
          <a className="btn ghost" href={site.social.instagram}>{d.contact_ig}</a>
        </div>
      </div>
    </section>
  );
}

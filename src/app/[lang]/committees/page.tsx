import type { Metadata } from "next";
import Link from "next/link";
import { getSeasons } from "@/lib/seasons";
import { getDict, getLang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: getDict(await getLang(params)).n_com };
}

export default async function Committees({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const seasons = await getSeasons();
  return (
    <section className="flags inner">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">{d.n_com}</div>
          <h2>{d.c_h}</h2>
          <p>{d.c_p}</p>
        </div>
        {seasons.map((s, i) => (
          <div key={s.slug}>
            <div className="season-bar" style={i === 0 ? { marginTop: 0 } : undefined}>
              <div className="subhead">{s.title[lang]} · {s.date[lang]}</div>
              <Link className="btn season-btn" href={`/${lang}/seasons/${s.slug}`}>{d.open_season}</Link>
            </div>
            <div className="committees">
              {s.committees.map((c) => (
                <Link className="com" key={c.slug} href={`/${lang}/committees/${c.slug}`}>
                  <small>{c.body[lang]}</small>
                  <h3>{c.agenda[lang]}</h3>
                  <span className="more">{d.view_details}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

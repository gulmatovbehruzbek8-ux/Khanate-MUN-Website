import type { Metadata } from "next";
import Link from "next/link";
import { getSeasons } from "@/lib/seasons";
import { getDict, getLang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: getDict(await getLang(params)).n_seasons };
}

export default async function Seasons({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const seasons = await getSeasons();
  return (
    <section className="inner">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">{d.n_seasons}</div>
          <h2>{d.seasons_h}</h2>
        </div>
        <div className="committees">
          {seasons.map((s, i) => (
            <Link className="com" key={s.slug} href={`/${lang}/seasons/${s.slug}`}>
              {s.images?.[0] && <img className="cover-thumb" src={s.images[0].url} alt="" loading="lazy" />}
              <small>{i === 0 ? d.latest_l : d.past_l}</small>
              <h3>{s.title[lang]} · {s.date[lang]}</h3>
              <p>{s.summary[lang]}</p>
              <span className="more">{d.view_details}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

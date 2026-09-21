import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { getSeasons } from "@/lib/seasons";
import { getDict, getLang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: getDict(await getLang(params)).n_about };
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const seasons = await getSeasons();
  const s = site.lastSeason;
  return (
    <section className="inner">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">{d.n_about}</div>
          <h2>{d.a_h}</h2>
          <p>{d.a_p}</p>
        </div>
        <div className="facts">
          <div className="fact"><b>{s.dateLabel}</b><span>{d.f1}</span></div>
          <div className="fact"><b>{s.city}</b><span>{d.f2}</span></div>
          <div className="fact"><b>{s.committeeCount}</b><span>{d.f3}</span></div>
        </div>
        <div className="head" style={{ margin: "56px 0 24px" }}>
          <h2 style={{ fontSize: "clamp(22px,3vw,30px)" }}>{d.seasons_h}</h2>
        </div>
        {seasons.some((s) => s.upcoming) && (
          <div className="committees next-wrap">
            {seasons.filter((s) => s.upcoming).map((s) => (
              <Link className="com next" key={s.slug} href={`/${lang}/seasons/${s.slug}`}>
                {s.images?.[0] && <img className="cover-thumb" src={s.images[0].url} alt="" loading="lazy" />}
                <small>{d.soon_l}</small>
                <h3>{s.title[lang]} · {s.date[lang]}</h3>
                <p>{s.summary[lang]}</p>
                <span className="more">{d.view_details}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="committees">
          {seasons.filter((s) => !s.upcoming).map((s, i) => (
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

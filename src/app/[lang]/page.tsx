import Link from "next/link";
import Countdown from "@/components/Countdown";
import { site } from "@/content/site";
import { getDict, getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getSeasons } from "@/lib/seasons";
import Gallery from "@/components/Gallery";

export const revalidate = 600;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const { nextSeasonStart } = await getSettings();
  const seasons = await getSeasons();
  const upcoming = seasons.find((s) => s.upcoming);
  const withPhotos = seasons.find((s) => !s.upcoming && s.images && s.images.length > 0);
  const tiles = [
    { href: "about", t: d.t1, s: d.t1d },
    { href: "committees", t: d.t2, s: d.t2d },
    { href: "register", t: d.t3, s: d.t3d },
    { href: "team", t: d.t4, s: d.t4d },
  ];
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">{d.eyebrow}</div>
            <h1>{d.h1}</h1>
            <p className="lead">{d.lead}</p>
            <div className="cta">
              <Link className="btn" href={`/${lang}/register`}>{d.cta1}</Link>
              <Link className="btn ghost" href={`/${lang}/committees`}>{d.cta2}</Link>
            </div>
          </div>
          <div className="crest">
            <img alt="KhanateMUN emblem: Kalta Minor and Juma minaret inside a crescent and olive wreath" src="/logo.jpg" width={660} height={660} />
          </div>
        </div>
      </header>
      {nextSeasonStart && new Date(nextSeasonStart).getTime() > Date.now() ? (
        <Countdown lang={lang} dict={d} startsAt={nextSeasonStart} />
      ) : (
        <div className="cdband soon">
          <div className="wrap">
            <div>
              <div className="eyebrow">{d.soon_l}</div>
              <div className="soon-t">{d.soon}</div>
            </div>
            <a className="btn" href={site.social.telegram}>{d.soon_cta}</a>
          </div>
        </div>
      )}
      {upcoming && (
        <section className="next-home">
          <div className="wrap">
            <div className="next-card">
              <div className="next-tag">{d.soon_l}</div>
              <h2>{upcoming.title[lang]}{upcoming.date[lang] ? ` · ${upcoming.date[lang]}` : ""}</h2>
              {upcoming.venue[lang] && <div className="next-venue">{upcoming.venue[lang]}</div>}
              {upcoming.summary[lang] && <p>{upcoming.summary[lang]}</p>}
              <div className="cta">
                <Link className="btn" href={`/${lang}/register`}>{d.cta1}</Link>
                <Link className="btn ghost" href={`/${lang}/seasons/${upcoming.slug}`}>{d.view_details}</Link>
              </div>
            </div>
          </div>
        </section>
      )}
      <section>
        <div className="wrap">
          <div className="head"><div className="eyebrow">{d.explore}</div></div>
          <div className="tiles">
            {tiles.map((t) => (
              <Link key={t.href} className="tile" href={`/${lang}/${t.href}`}>
                <b>{t.t}</b>
                <span>{t.s}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {withPhotos && (
        <section className="moments">
          <div className="wrap">
            <div className="head" style={{ marginBottom: 22 }}>
              <div className="eyebrow">{d.moments_h} {withPhotos.title[lang]}</div>
            </div>
            <Gallery
              items={withPhotos.images!.slice(0, 6).map((im) => ({ url: im.url, caption: im.caption?.[lang] }))}
            />
            <Link className="btn ghost" href={`/${lang}/seasons/${withPhotos.slug}`}>{d.moments_cta}</Link>
          </div>
        </section>
      )}
      <section className="qa">
        <div className="wrap">
          <div>
            <h2>{d.qa_h}</h2>
            <p>{d.qa_p}</p>
          </div>
          <Link className="btn" href={`/${lang}/faq`}>{d.qa_cta}</Link>
        </div>
      </section>
    </>
  );
}

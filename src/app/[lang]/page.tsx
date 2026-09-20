import Link from "next/link";
import Countdown from "@/components/Countdown";
import { site } from "@/content/site";
import { getDict, getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export const revalidate = 30;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const { nextSeasonStart } = await getSettings();
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
      {nextSeasonStart ? (
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
    </>
  );
}

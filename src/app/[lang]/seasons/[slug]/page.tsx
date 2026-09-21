import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeason, getSeasons } from "@/lib/seasons";
import { getDict, getLang } from "@/lib/i18n";
import Gallery, { CoverImage } from "@/components/Gallery";

type P = { params: Promise<{ lang: string; slug: string }> };

// Seasons and committees are added from the admin panel, so render on demand (data is cached ~60 s inside getSeasons).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const lang = await getLang(params);
  const s = await getSeason((await params).slug);
  return { title: s ? `${s.title[lang]} · ${s.date[lang]}` : "Not found" };
}

const fmt = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} UZS`;

export default async function SeasonPage({ params }: P) {
  const lang = await getLang(params);
  const s = await getSeason((await params).slug);
  if (!s) notFound();
  const d = getDict(lang);

  return (
    <section className="inner">
      <div className="wrap">
        <Link className="crumb" href={`/${lang}/about`}>← {d.all_seasons}</Link>
        <div className="head" style={{ marginTop: 22 }}>
          {s.upcoming && <div className="next-tag">{d.soon_l}</div>}
          <div className="eyebrow">{s.date[lang]}</div>
          <h2>{s.title[lang]}</h2>
          <p>{s.summary[lang]}</p>
          {s.upcoming && <Link className="btn" href={`/${lang}/register`} style={{ marginTop: 18 }}>{d.cta1}</Link>}
        </div>

        {s.images?.[0] && (
          <figure className="cover">
            <CoverImage item={{ url: s.images[0].url, caption: s.images[0].caption?.[lang] || s.title[lang] }} />
          </figure>
        )}

        <div className="detail">
          <div>
            <section>
              <h3>{d.committees_l}</h3>
              <div className="committees" style={{ gridTemplateColumns: "1fr" }}>
                {s.committees.map((c) => (
                  <Link className="com" key={c.slug} href={`/${lang}/committees/${c.slug}`}>
                    <small>{c.body[lang]}</small>
                    <h3>{c.agenda[lang]}</h3>
                    <span className="more">{d.view_details}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h3>{s.upcoming ? d.perks_up : d.perks_l}</h3>
              <ul className="list">
                {s.perks.map((p, i) => (
                  <li key={i}>{p[lang]}</li>
                ))}
              </ul>
            </section>
          </div>

          <div>
            <section>
              <dl className="meta">
                <div><dt>{d.date_l}</dt><dd>{s.date[lang]}</dd></div>
                <div><dt>{d.venue_l}</dt><dd>{s.venue[lang]}</dd></div>
                <div><dt>{d.committees_l}</dt><dd>{s.committees.length}</dd></div>
              </dl>
            </section>
            <section>
              <h3>{d.fees_l}</h3>
              <dl className="meta">
                {s.fees.map((f, i) => (
                  <div key={i}>
                    <dt>{f.label[lang]}</dt>
                    <dd>{f.free ? d.free_l : fmt(f.uzs)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {s.keyDates && (
              <section>
                <h3>{d.keydates_l}</h3>
                <dl className="meta">
                  {s.keyDates.map((k, i) => (
                    <div key={i}>
                      <dt>{k.label[lang]}</dt>
                      <dd>{k.date[lang]}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>

        {s.images && s.images.length > 0 && (
          <>
            {s.images.length > 1 && <div className="subhead">{d.gallery_l}</div>}
            <Gallery items={s.images.map((im) => ({ url: im.url, caption: im.caption?.[lang] }))} from={1} />
          </>
        )}

        <div className="subhead">{d.reg_prompt}</div>
        <Link className="btn" href={`/${lang}/register`}>{d.cta1}</Link>
      </div>
    </section>
  );
}

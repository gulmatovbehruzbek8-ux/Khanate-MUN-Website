import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCommittee } from "@/lib/seasons";
import { getDict, getLang } from "@/lib/i18n";
import Gallery from "@/components/Gallery";

type P = { params: Promise<{ lang: string; slug: string }> };

// Seasons and committees are added from the admin panel, so render on demand (data is cached ~60 s inside getSeasons).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const lang = await getLang(params);
  const found = await findCommittee((await params).slug);
  return { title: found ? found.committee.body[lang] : "Not found" };
}

export default async function CommitteePage({ params }: P) {
  const lang = await getLang(params);
  const found = await findCommittee((await params).slug);
  if (!found) notFound();
  const { season, committee: c } = found;
  const d = getDict(lang);
  const others = season.committees.filter((o) => o.slug !== c.slug);

  return (
    <section className="flags inner">
      <div className="wrap">
        <Link className="crumb" href={`/${lang}/committees`}>← {d.back_com}</Link>
        <div className="head" style={{ marginTop: 22, maxWidth: "none" }}>
          <div className="eyebrow">{c.body[lang]} · {season.title[lang]}</div>
          <h2 className="agenda">{c.agenda[lang]}</h2>
        </div>

        <div className="detail">
          <div>
            <section>
              <h3>{d.about_body}</h3>
              <p style={{ color: "var(--mute)", margin: 0 }}>{c.about[lang]}</p>
            </section>
            <section>
              <h3>{d.chairs_l}</h3>
              {c.chairs ? (
                <dl className="meta">
                  {c.chairs.map((ch) => (
                    <div key={ch.name}>
                      <dt>{ch.role === "head" ? d.head_chair : d.co_chair}</dt>
                      <dd>{ch.name}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p style={{ color: "var(--mute)", margin: 0 }}>{d.chairs_none}</p>
              )}
            </section>
          </div>

          <div>
            <section>
              <dl className="meta">
                <div><dt>{d.season_of}</dt><dd><Link href={`/${lang}/seasons/${season.slug}`}>{season.title[lang]}</Link></dd></div>
                <div><dt>{d.date_l}</dt><dd>{season.date[lang]}</dd></div>
                <div><dt>{d.venue_l}</dt><dd>{season.venue[lang]}</dd></div>
                {c.language && <div><dt>{d.lang_l}</dt><dd>{c.language[lang]}</dd></div>}
              </dl>
            </section>
          </div>
        </div>

        {c.images && c.images.length > 0 && (
          <>
            <div className="subhead">{d.gallery_l}</div>
            <Gallery items={c.images.map((im) => ({ url: im.url }))} />
          </>
        )}

        <div className="subhead">{d.more_com}</div>
        <div className="committees">
          {others.map((o) => (
            <Link className="com" key={o.slug} href={`/${lang}/committees/${o.slug}`}>
              <small>{o.body[lang]}</small>
              <h3>{o.agenda[lang]}</h3>
              <span className="more">{d.view_details}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

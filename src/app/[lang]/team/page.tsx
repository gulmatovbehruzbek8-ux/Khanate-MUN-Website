import type { Metadata } from "next";
import { getDict, getLang } from "@/lib/i18n";
import { getTeam } from "@/lib/team";
import { focusStyle } from "@/lib/focus";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: getDict(await getLang(params)).n_team };
}

const Silhouette = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="34" r="17" />
    <path d="M14 92c0-22 15-36 36-36s36 14 36 36z" />
  </svg>
);

export default async function Team({ params }: { params: Promise<{ lang: string }> }) {
  const d = getDict(await getLang(params));
  const team = await getTeam();
  return (
    <section className="flags inner">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">{d.n_team}</div>
          <h2>{d.t_h}</h2>
          <p>{d.t_p}</p>
        </div>
        <div className="team">
          {team.map((p, i) => (
            <div className="person" key={i}>
              <div className="avatar" style={p.photo ? { overflow: "hidden" } : undefined}>
                {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", ...focusStyle(p.focus) }} /> : <Silhouette />}
              </div>
              <b>{p.name}</b>
              <span>{p.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

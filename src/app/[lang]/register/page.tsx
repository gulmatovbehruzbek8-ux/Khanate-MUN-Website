import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import { site } from "@/content/site";
import { getDict, getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getSeasons } from "@/lib/seasons";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: getDict(await getLang(params)).n_reg };
}

const feeLabel = { delegate: "fee1", delegate_meal: "fee2", observer: "fee3" } as const;

export default async function Register({ params }: { params: Promise<{ lang: string }> }) {
  const lang = await getLang(params);
  const d = getDict(lang);
  const settings = await getSettings();
  const next = (await getSeasons()).find((s) => s.upcoming);
  const nextFees = next?.fees.filter((f) => f.free || f.uzs > 0) ?? [];
  const nextPerks = next?.perks.filter((p) => p[lang]) ?? [];
  const fmt = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} UZS`;
  return (
    <section className="inner">
      <div className="wrap reg">
        <div>
          <div className="head" style={{ marginBottom: 20 }}>
            <div className="eyebrow">{d.n_reg}</div>
            <h2>{d.r_h}</h2>
            <p>{next ? `${next.title[lang]}${next.date[lang] ? ` · ${next.date[lang]}` : ""}` : d.r_p}</p>
          </div>
          <table className="fees">
            <tbody>
              {nextFees.length > 0
                ? nextFees.map((f, i) => (
                    <tr key={i}>
                      <td>{f.label[lang]}</td>
                      <td>{f.free ? d.free_l : fmt(f.uzs)}</td>
                    </tr>
                  ))
                : site.fees.map((f) => (
                    <tr key={f.key}>
                      <td>{d[feeLabel[f.key]]}</td>
                      <td>{fmt(f.key === "observer" ? settings.feeObserver : settings.feeDelegate)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          <ul className="perks">
            {nextPerks.length > 0 ? (
              nextPerks.map((p, i) => <li key={i}>{p[lang]}</li>)
            ) : (
              <>
                <li>{d.p1}</li>
                <li>{d.p2}</li>
              </>
            )}
            <li>{d.p3}</li>
          </ul>
        </div>
        <RegisterForm lang={lang} dict={d} open={settings.registrationOpen} fees={{ delegate_meal: settings.feeDelegate, observer: settings.feeObserver }} />
      </div>
    </section>
  );
}

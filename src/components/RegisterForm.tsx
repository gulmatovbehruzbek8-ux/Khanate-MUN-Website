"use client";

import { useState } from "react";
import type { Dict, Lang } from "@/lib/dictionaries";
import { site } from "@/content/site";

type Status = "idle" | "sending" | "ok" | "error";

export default function RegisterForm({ lang, dict, open, fees }: { lang: Lang; dict: Dict; open: boolean; fees: { delegate_meal: number; observer: number } }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<{ name: string; telegram: string; fee: string } | null>(null);
  const [ticket, setTicket] = useState<string>("delegate_meal");
  const fmt = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} UZS`;
  const price = (key: string) => (key === "observer" ? fees.observer : fees.delegate_meal);
  const label: Record<string, string> = { delegate: dict.o_del, delegate_meal: dict.o_meal, observer: dict.o_obs };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, lang }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent({ name: String(data.name ?? ""), telegram: String(data.telegram ?? ""), fee: fmt(price(String(data.ticket ?? ticket))) });
        setStatus("ok");
        form.reset();
        setTicket("delegate_meal");
      } else {
        setStatus("error");
        setMessage(json.error === "fields" ? dict.err_fields : json.error === "closed" ? dict.closed : dict.err_generic);
      }
    } catch {
      setStatus("error");
      setMessage(dict.err_generic);
    }
  }

  if (!open) {
    return <div className="form-closed">{dict.closed}</div>;
  }

  if (status === "ok" && sent) {
    return (
      <div className="done" role="status">
        <h3>{dict.ok_h}</h3>
        <p className="sum">
          {dict.ok_for}: {sent.name} · {sent.telegram.startsWith("@") ? sent.telegram : `@${sent.telegram}`} · {sent.fee}
        </p>
        <ol>
          <li>{dict.ok_1}</li>
          <li>{dict.ok_2}</li>
          <li>{dict.ok_3}</li>
        </ol>
        <div className="cta">
          <a className="btn" href={site.social.telegram}>{dict.ok_tg}</a>
          <button type="button" className="btn ghost" onClick={() => { setStatus("idle"); setSent(null); }}>{dict.ok_again}</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off">
      <div className="row">
        <label htmlFor="name">
          <span>{dict.l_name}</span>
          <input id="name" name="name" required maxLength={80} />
        </label>
        <label htmlFor="school">
          <span>{dict.l_school}</span>
          <input id="school" name="school" maxLength={120} />
        </label>
      </div>
      <div className="row">
        <label htmlFor="telegram">
          <span>{dict.l_tg}</span>
          <input id="telegram" name="telegram" required maxLength={64} placeholder="@username" />
        </label>
        <label htmlFor="referral">
          <span>{dict.l_ref}</span>
          <input id="referral" name="referral" maxLength={40} />
        </label>
      </div>
      <label htmlFor="committee">
        <span>{dict.l_com}</span>
        <select id="committee" name="committee" defaultValue={site.committees[0].body}>
          {site.committees.map((c) => (
            <option key={c.body} value={c.body}>
              {c.body}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="ticket">
        <span>{dict.l_role}</span>
        <select id="ticket" name="ticket" value={ticket} onChange={(e) => setTicket(e.target.value)}>
          {site.fees.map((f) => (
            <option key={f.key} value={f.key}>
              {label[f.key]} · {fmt(price(f.key))}
            </option>
          ))}
        </select>
      </label>
      {/* Honeypot: real people never see or fill this. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="hp_x9">Leave this empty</label>
        <input id="hp_x9" name="hp_x9" type="text" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" />
      </div>
      <div className="total">
        <span>{dict.total_l}</span>
        <b>{fmt(price(ticket))}</b>
      </div>
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? dict.sending : dict.submit}
      </button>
      {status === "error" && (
        <div className="err" role="alert">
          {message}
        </div>
      )}
    </form>
  );
}

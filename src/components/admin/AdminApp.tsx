"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminBar from "./AdminBar";
import { STATUSES, type Registration, type Settings } from "@/lib/types";

const fmt = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} UZS`;

// Tashkent is UTC+5 all year. datetime-local inputs have no timezone, so convert explicitly.
const toInput = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 5 * 3600_000).toISOString().slice(0, 16) : "";
const fromInput = (v: string) => (v ? `${v}:00+05:00` : "");

const REFERRAL_UZS = 10000;
const REFERRAL_CAP = 2;

export default function AdminApp({ sheetUrl }: { sheetUrl: string | null }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [store, setStore] = useState<"sheets" | "dev" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fTicket, setFTicket] = useState("");
  const [fCommittee, setFCommittee] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [start, setStart] = useState("");
  const [open, setOpen] = useState(false);
  const [feeDel, setFeeDel] = useState("");
  const [feeObs, setFeeObs] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmRow, setConfirmRow] = useState<number | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // The Google script can be slow to wake up; try once more before giving up.
      let res = await fetch("/api/admin/registrations", { cache: "no-store" });
      if (res.status === 401) return location.reload();
      if (!res.ok) res = await fetch("/api/admin/registrations", { cache: "no-store" });
      if (res.status === 401) return location.reload();
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.registrations);
      setStore(data.store);
    } catch {
      setError("Could not load registrations. Check the Google Sheets settings and try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings(s);
        setStart(toInput(s.nextSeasonStart));
        setOpen(s.registrationOpen);
        setFeeDel(String(s.feeDelegate));
        setFeeObs(String(s.feeObserver));
      })
      .catch(() => {});
  }, [load]);

  async function changeStatus(row: number, status: string) {
    const before = rows;
    setRows((rs) => rs.map((r) => (r.row === row ? { ...r, status } : r)));
    const res = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, status }),
    }).catch(() => null);
    if (!res?.ok) {
      setRows(before);
      setError("Could not save that status change.");
    }
  }

  async function remove(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/registrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setBusy(false);
    setConfirmRow(null);
    setConfirmAll(false);
    if (res?.status === 409) setError("That list was out of date, so nothing was deleted. Refreshed.");
    else if (!res?.ok) setError("Could not delete. Try again.");
    await load();
  }

  async function saveSettings() {
    setSaveMsg("Saving…");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextSeasonStart: fromInput(start), registrationOpen: open, feeDelegate: Number(feeDel), feeObserver: Number(feeObs) }),
    }).catch(() => null);
    if (res?.ok) {
      setSaveMsg("Saved. The public site updates within a minute.");
      setSettings({ nextSeasonStart: fromInput(start) || null, registrationOpen: open, feeDelegate: Number(feeDel), feeObserver: Number(feeObs) });
    } else {
      setSaveMsg("Could not save. Try again.");
    }
  }

  const committees = useMemo(() => [...new Set(rows.map((r) => r.committee).filter(Boolean))], [rows]);
  const tickets = useMemo(() => [...new Set(rows.map((r) => r.ticket).filter(Boolean))], [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => (!fStatus || r.status === fStatus) && (!fTicket || r.ticket === fTicket) && (!fCommittee || r.committee === fCommittee))
      .filter((r) => !needle || [r.name, r.school, r.telegram, r.referral, r.code ?? ""].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => b.row - a.row); // newest first
  }, [rows, q, fStatus, fTicket, fCommittee]);

  const stats = useMemo(() => {
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      fresh: count("New"),
      accepted: count("Accepted"),
      paid: count("Paid"),
      expected: rows.filter((r) => r.status !== "Rejected").reduce((s, r) => s + r.fee, 0),
      collected: rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.fee, 0),
    };
  }, [rows]);

  const tally = (key: (r: Registration) => string) => {
    const m = new Map<string, number>();
    rows.filter((r) => r.status !== "Rejected").forEach((r) => key(r) && m.set(key(r), (m.get(key(r)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  // Referrals: who used whose code. Payback is 10 000 UZS per referral, up to 2 per referrer.
  const referrals = useMemo(() => {
    const byCode = new Map<string, Registration>();
    rows.forEach((r) => r.code && byCode.set(r.code, r));
    const m = new Map<string, Registration[]>();
    rows.filter((r) => r.referral && r.status !== "Rejected").forEach((r) => m.set(r.referral, [...(m.get(r.referral) ?? []), r]));
    return [...m.entries()]
      .map(([code, friends]) => ({ code, referrer: byCode.get(code), friends, payback: Math.min(friends.length, REFERRAL_CAP) * REFERRAL_UZS }))
      .sort((a, b) => b.friends.length - a.friends.length);
  }, [rows]);

  const byTicket = tally((r) => r.ticket);
  const byCommittee = tally((r) => r.committee);

  return (
    <div className="adm">
      <AdminBar sheetUrl={sheetUrl} />

      <main className="wrap adm-main">
        {store === "dev" && (
          <div className="adm-note">
            Local test data: Google Sheets is not connected, so registrations are stored in a file on this computer.
          </div>
        )}
        {error && <div className="err" role="alert">{error}</div>}

        <div className="adm-stats">
          <Stat label="Registrations" value={stats.total} />
          <Stat label="New (to review)" value={stats.fresh} accent />
          <Stat label="Accepted" value={stats.accepted} />
          <Stat label="Paid" value={stats.paid} />
          <Stat label="Expected income" value={fmt(stats.expected)} />
          <Stat label="Collected" value={fmt(stats.collected)} />
        </div>

        <div className="adm-grid">
          <section className="adm-panel">
            <h2>Website settings</h2>
            <label className="adm-check" htmlFor="ro">
              <input id="ro" type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
              <span>Registration is open</span>
            </label>
            <label htmlFor="ns">
              <span>Next season starts (Tashkent time)</span>
              <input id="ns" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <p className="adm-hint">Leave the date empty to show "Date coming soon" instead of the countdown.</p>
            <label htmlFor="fd">
              <span>Delegate price (UZS)</span>
              <input id="fd" type="number" min="0" step="1000" value={feeDel} onChange={(e) => setFeeDel(e.target.value)} />
            </label>
            <label htmlFor="fo">
              <span>Observer price (UZS)</span>
              <input id="fo" type="number" min="0" step="1000" value={feeObs} onChange={(e) => setFeeObs(e.target.value)} />
            </label>
            <p className="adm-hint">These prices appear on the registration page and form, and are saved with each registration.</p>
            <div className="adm-row">
              <button className="btn" onClick={saveSettings} disabled={!settings}>Save settings</button>
              <span className="adm-msg" role="status">{saveMsg}</span>
            </div>
          </section>

          <section className="adm-panel">
            <h2>Breakdown</h2>
            <div className="adm-split">
              <List title="By ticket" items={byTicket} />
              <List title="By committee" items={byCommittee} />
            </div>
          </section>

        </div>

        <section className="adm-panel">
          <h2>Referrals ({referrals.length})</h2>
          {referrals.length === 0 ? (
            <p className="adm-hint">No one has used a referral code yet.</p>
          ) : (
            <div className="adm-scroll">
              <table className="adm-table">
                <thead><tr><th>Referrer</th><th>Code</th><th>Friends who registered</th><th>To pay back</th></tr></thead>
                <tbody>
                  {referrals.map((g) => (
                    <tr key={g.code}>
                      <td><b>{g.referrer ? g.referrer.name : "Unknown (deleted)"}</b> {g.referrer?.telegram}</td>
                      <td className="nowrap">{g.code}</td>
                      <td>{g.friends.map((f) => f.name).join(", ")}</td>
                      <td className="nowrap">{fmt(g.payback)}{g.friends.length > REFERRAL_CAP ? " (capped)" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-panel">
          <div className="adm-tools">
            <h2>Registrations ({shown.length})</h2>
            <input aria-label="Search" placeholder="Search name, school, Telegram…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select aria-label="Status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select aria-label="Ticket" value={fTicket} onChange={(e) => setFTicket(e.target.value)}>
              <option value="">All tickets</option>
              {tickets.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select aria-label="Committee" value={fCommittee} onChange={(e) => setFCommittee(e.target.value)}>
              <option value="">All committees</option>
              {committees.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn ghost" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
            <a className="btn" href="/api/admin/export">Export CSV</a>
            {rows.length > 0 &&
              (confirmAll ? (
                <>
                  <button className="btn danger" onClick={() => remove({ all: true })} disabled={busy}>
                    {busy ? "Deleting…" : `Yes, delete all ${rows.length}`}
                  </button>
                  <button className="btn ghost" onClick={() => setConfirmAll(false)} disabled={busy}>Cancel</button>
                </>
              ) : (
                <button className="btn ghost" onClick={() => setConfirmAll(true)}>Delete all</button>
              ))}
          </div>

          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Time</th><th>Name</th><th>School</th><th>Telegram</th><th>Ticket</th>
                  <th>Fee</th><th>Committee</th><th>Referral used</th><th>Own code</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.row}>
                    <td className="nowrap">{r.time}</td>
                    <td><b>{r.name}</b></td>
                    <td>{r.school}</td>
                    <td><a href={`https://t.me/${r.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">{r.telegram}</a></td>
                    <td>{r.ticket}</td>
                    <td className="nowrap">{fmt(r.fee)}</td>
                    <td>{r.committee}</td>
                    <td className="nowrap">{r.referral}</td>
                    <td className="nowrap">{r.code}</td>
                    <td>
                      <select
                        className={`adm-status s-${r.status.toLowerCase()}`}
                        aria-label={`Status for ${r.name}`}
                        value={r.status}
                        onChange={(e) => changeStatus(r.row, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="nowrap">
                      {confirmRow === r.row ? (
                        <>
                          <button className="btn danger" disabled={busy} onClick={() => remove({ row: r.row, time: r.time, telegram: r.telegram })}>Delete?</button>{" "}
                          <button className="btn ghost" onClick={() => setConfirmRow(null)}>No</button>
                        </>
                      ) : (
                        <button className="btn ghost" aria-label={`Delete ${r.name}`} onClick={() => setConfirmRow(r.row)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && shown.length === 0 && <p className="adm-hint" style={{ padding: 16 }}>No registrations match.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`adm-stat${accent ? " accent" : ""}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function List({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="adm-hint">Nothing yet.</p>
      ) : (
        <ul>
          {items.map(([k, n]) => (
            <li key={k}><span>{k}</span><b>{n}</b></li>
          ))}
        </ul>
      )}
    </div>
  );
}

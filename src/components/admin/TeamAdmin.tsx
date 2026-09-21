"use client";

import { useEffect, useState } from "react";

interface Member {
  name: string;
  role: string;
  photo: string | null;
}

/** Shrinks a photo in the browser (square-ish avatars need little more than 800px). */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("Could not read that image");
  return blob;
}

export default function TeamAdmin() {
  const [team, setTeam] = useState<Member[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/team", { cache: "no-store" })
      .then((r) => (r.status === 401 ? location.reload() : r.json()))
      .then((d) => d && setTeam(d.team))
      .catch(() => setErr("Could not load the team."));
  }, []);

  function edit(fn: (t: Member[]) => void) {
    setTeam((t) => {
      const n = structuredClone(t);
      fn(n);
      return n;
    });
    setDirty(true);
    setMsg("");
  }

  function move(i: number, d: number) {
    edit((t) => {
      const j = i + d;
      if (j >= 0 && j < t.length) [t[i], t[j]] = [t[j], t[i]];
    });
  }

  async function upload(i: number, file: File | undefined) {
    if (!file) return;
    setErr("");
    setMsg("Uploading photo…");
    try {
      const fd = new FormData();
      fd.append("file", await shrink(file), "photo.jpg");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.url) throw new Error();
      edit((t) => { t[i].photo = j.url; });
    } catch {
      setMsg("");
      setErr("Could not upload that photo. Try a JPG or PNG.");
    }
  }

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("Saving…");
    const res = await fetch("/api/admin/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      const d = await res.json();
      setTeam(d.team);
      setDirty(false);
      setMsg("Saved. The public site updates within a minute.");
    } else {
      setMsg("");
      setErr(res?.status === 400 ? "Add at least one member with a name." : "Could not save. Try again.");
    }
  }

  return (
    <main className="wrap adm-main ed">
      <div className="adm-panel ed-sticky">
        <div className="adm-row">
          <button className="btn" onClick={save} disabled={busy || !dirty}>Save changes</button>
          <span className="adm-msg" role="status">{dirty && !msg ? "Unsaved changes" : msg}</span>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
      </div>

      <section className="adm-panel">
        <h2>Team ({team.length})</h2>
        <p className="adm-hint">Shown on the Team page in this order. Photos are shrunk automatically before upload.</p>
        {team.map((m, i) => (
          <div className="ed-item-row" key={i}>
            <div className="ed-inline">
              {m.photo ? (
                <img src={m.photo} alt="" width={56} height={56} style={{ borderRadius: 10, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: "#e6dfcf", flex: "none" }} />
              )}
              <input aria-label="Name" placeholder="Name" value={m.name} maxLength={80} onChange={(e) => edit((t) => { t[i].name = e.target.value; })} />
              <input aria-label="Role" placeholder="Role" value={m.role} maxLength={80} onChange={(e) => edit((t) => { t[i].role = e.target.value; })} />
            </div>
            <div className="ed-inline">
              <label className="btn ghost ed-file" htmlFor={`tp-${i}`}>{m.photo ? "Change photo" : "Add photo"}</label>
              <input id={`tp-${i}`} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { upload(i, e.target.files?.[0]); e.target.value = ""; }} />
              {m.photo && <button type="button" className="ed-x" onClick={() => edit((t) => { t[i].photo = null; })}>Remove photo</button>}
              <button type="button" className="btn ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="btn ghost" onClick={() => move(i, 1)} disabled={i === team.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="ed-x" onClick={() => edit((t) => { t.splice(i, 1); })}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => edit((t) => { t.push({ name: "", role: "", photo: null }); })}>+ Add member</button>
      </section>
    </main>
  );
}

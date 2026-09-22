"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { Chair, Committee, L, Season, SeasonImage } from "@/content/seasons";
import FocusPicker, { COMMITTEE_BOXES, SEASON_BOXES } from "./FocusPicker";

const blankL = (): L => ({ en: "", uz: "" });

const blankSeason = (n: number): Season => ({
  slug: `season-${n}`,
  number: n,
  title: { en: `Season ${n}`, uz: `${n}-mavsum` },
  date: blankL(),
  venue: { en: "Khiva Presidential School, Khiva", uz: "Xiva Prezident maktabi, Xiva" },
  summary: blankL(),
  fees: [],
  keyDates: [],
  perks: [],
  committees: [],
  images: [],
});

/** Shrinks a photo in the browser so it uploads fast and fits Vercel's request size limit. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.86;
  for (;;) {
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));
    if (blob && (blob.size < 3.5 * 1024 * 1024 || q < 0.5)) return blob;
    if (!blob) throw new Error("Could not read that image");
    q -= 0.1;
  }
}

export default function SeasonsAdmin() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [draft, setDraft] = useState<Season | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  async function load(selectSlug?: string) {
    const res = await fetch("/api/admin/seasons", { cache: "no-store" });
    if (res.status === 401) return location.reload();
    const data = await res.json();
    setSeasons(data.seasons);
    const pick = data.seasons.find((s: Season) => s.slug === (selectSlug ?? draft?.slug)) ?? data.seasons[0];
    if (pick) open(pick);
  }

  function open(s: Season) {
    setDraft(structuredClone(s));
    setIsNew(false);
    setDirty(false);
    setMsg("");
    setErr("");
    setConfirmDelete(false);
  }

  useEffect(() => {
    load().catch(() => setErr("Could not load seasons."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(fn: (d: Season) => void) {
    setDraft((d) => {
      if (!d) return d;
      const n = structuredClone(d);
      fn(n);
      return n;
    });
    setDirty(true);
    setMsg("");
  }

  function startNew() {
    const n = Math.max(0, ...seasons.map((s) => s.number)) + 1;
    setDraft(blankSeason(n));
    setIsNew(true);
    setDirty(true);
    setMsg("");
    setErr("");
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    setMsg("Saving…");
    const res = await fetch("/api/admin/seasons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMsg("Saved. The public site updates within a minute.");
      setDirty(false);
      await load(draft.slug);
    } else {
      setMsg("");
      setErr(res?.status === 400 ? "Some fields are invalid. Check the season number and the slug." : "Could not save. Try again.");
    }
  }

  async function remove() {
    if (!draft) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    const res = await fetch(`/api/admin/seasons?slug=${encodeURIComponent(draft.slug)}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMsg("Done.");
      await load();
    } else setErr("Could not do that. Try again.");
  }

  async function addPhotos(files: FileList | null, ci?: number) {
    if (!files?.length) return;
    setErr("");
    for (const file of Array.from(files)) {
      try {
        setMsg(`Uploading ${file.name}…`);
        const blob = await shrink(file);
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const why =
            data.error === "storage"
              ? "Image storage is not set up yet. Connect a Vercel Blob store (see the README)."
              : data.error === "too_big"
                ? "That photo is too large."
                : "Upload failed.";
          setErr(why);
          setMsg("");
          return;
        }
        edit((d) => {
          if (ci === undefined) (d.images ??= []).push({ url: data.url });
          else (d.committees[ci].images ??= []).push({ url: data.url });
        });
      } catch {
        setErr(`Could not read ${file.name}. Use a JPG, PNG or WebP photo.`);
        setMsg("");
        return;
      }
    }
    setMsg("Photos added. Press Save to publish them.");
  }

  const num = (v: string) => Number(v) || 0;

  return (
    <main className="wrap adm-main ed">
      <div className="ed-layout">
        <aside className="adm-panel ed-list">
          <h2>Seasons</h2>
          {seasons.map((s) => (
            <button
              key={s.slug}
              className={`ed-item${draft?.slug === s.slug && !isNew ? " on" : ""}`}
              onClick={() => open(s)}
            >
              <b>{s.title.en || s.slug}</b>
              <span>{s.date.en}</span>
            </button>
          ))}
          <button className="btn ghost" onClick={startNew}>+ New season</button>
        </aside>

        {draft && (
          <div className="ed-form">
            <div className="adm-panel ed-sticky">
              <div className="adm-row">
                <button className="btn" onClick={save} disabled={busy || !dirty}>Save changes</button>
                <button className={`btn ghost${confirmDelete ? " danger" : ""}`} onClick={remove} disabled={busy || isNew}>
                  {confirmDelete ? "Click again to confirm" : "Discard my edits / delete"}
                </button>
                <span className="adm-msg" role="status">{dirty && !msg ? "Unsaved changes" : msg}</span>
              </div>
              {err && <div className="err" role="alert">{err}</div>}
            </div>

            <section className="adm-panel">
              <h2>Basics</h2>
              <div className="ed-row3">
                <label htmlFor="ed-num"><span>Season number (sets the order)</span>
                  <input id="ed-num" type="number" min={1} value={draft.number} onChange={(e) => edit((d) => { d.number = num(e.target.value); })} />
                </label>
                <label htmlFor="ed-slug"><span>Web address ending</span>
                  <input id="ed-slug" value={draft.slug} disabled={!isNew} onChange={(e) => edit((d) => { d.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); })} />
                </label>
              </div>
              <label className="adm-check" htmlFor="ed-upcoming">
                <input id="ed-upcoming" type="checkbox" checked={draft.upcoming === true} onChange={(e) => edit((d) => { d.upcoming = e.target.checked || undefined; })} />
                {" "}This is the upcoming season (shown separately and highlighted on the Seasons page)
              </label>
              <Pair label="Title" value={draft.title} onChange={(v) => edit((d) => { d.title = v; })} />
              <Pair label="Date" value={draft.date} onChange={(v) => edit((d) => { d.date = v; })} />
              <Pair label="Venue" value={draft.venue} onChange={(v) => edit((d) => { d.venue = v; })} />
              <Pair label="Summary" multiline value={draft.summary} onChange={(v) => edit((d) => { d.summary = v; })} />
            </section>

            <section className="adm-panel">
              <h2>Photos</h2>
              <p className="adm-hint">Press "Make cover" on any photo to use it as the cover. Photos are shrunk automatically before upload.</p>
              <label className="btn ghost ed-file" htmlFor="ed-photos">
                Add photos
                <input id="ed-photos" type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
              </label>
              <div className="ed-photos">
                {(draft.images ?? []).map((im: SeasonImage, i: number) => (
                  <div className="ed-photo" key={im.url + i}>
                    <img src={im.url} alt="" style={{ objectPosition: im.focus ? `${im.focus.x}% ${im.focus.y}%` : undefined }} />
                    {i === 0 && <span className="pill">Cover</span>}
                    <input aria-label="Caption in English" placeholder="Caption (EN)" value={im.caption?.en ?? ""} onChange={(e) => edit((d) => { const c = d.images![i]; c.caption = { en: e.target.value, uz: c.caption?.uz ?? "" }; })} />
                    <input aria-label="Caption in Uzbek" placeholder="Caption (UZ)" value={im.caption?.uz ?? ""} onChange={(e) => edit((d) => { const c = d.images![i]; c.caption = { en: c.caption?.en ?? "", uz: e.target.value }; })} />
                    <div className="ed-btns">
                      {i !== 0 && <button type="button" className="ed-cover" onClick={() => edit((d) => { const [x] = d.images!.splice(i, 1); d.images!.unshift(x); })}>★ Make cover</button>}
                      <button type="button" onClick={() => setOpenPicker(openPicker === `s-${i}` ? null : `s-${i}`)}>{openPicker === `s-${i}` ? "Close" : "Adjust crop"}</button>
                      <button type="button" disabled={i === 0} onClick={() => edit((d) => { const [x] = d.images!.splice(i, 1); d.images!.splice(i - 1, 0, x); })}>← Earlier</button>
                      <button type="button" disabled={i === (draft.images?.length ?? 0) - 1} onClick={() => edit((d) => { const [x] = d.images!.splice(i, 1); d.images!.splice(i + 1, 0, x); })}>Later →</button>
                      <button type="button" onClick={() => edit((d) => { d.images!.splice(i, 1); })}>Remove</button>
                    </div>
                    {openPicker === `s-${i}` && (
                      <FocusPicker
                        src={im.url}
                        focus={im.focus}
                        onChange={(f) => edit((d) => { d.images![i].focus = f; })}
                        boxes={SEASON_BOXES}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="adm-panel">
              <h2>Fees</h2>
              {draft.fees.map((f, i) => (
                <div className="ed-item-row" key={i}>
                  <Pair label="Name" value={f.label} onChange={(v) => edit((d) => { d.fees[i].label = v; })} />
                  <div className="ed-inline">
                    <label htmlFor={`fee-${i}`}><span>Price (UZS)</span>
                      <input id={`fee-${i}`} type="number" min={0} value={f.uzs} disabled={f.free} onChange={(e) => edit((d) => { d.fees[i].uzs = num(e.target.value); })} />
                    </label>
                    <label className="adm-check" htmlFor={`free-${i}`}>
                      <input id={`free-${i}`} type="checkbox" checked={!!f.free} onChange={(e) => edit((d) => { d.fees[i].free = e.target.checked; if (e.target.checked) d.fees[i].uzs = 0; })} />
                      <span>Free</span>
                    </label>
                    <button type="button" className="ed-x" onClick={() => edit((d) => { d.fees.splice(i, 1); })}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn ghost" onClick={() => edit((d) => { d.fees.push({ label: blankL(), uzs: 0 }); })}>+ Add fee</button>
            </section>

            <section className="adm-panel">
              <h2>Key dates</h2>
              {(draft.keyDates ?? []).map((k, i) => (
                <div className="ed-item-row" key={i}>
                  <Pair label="What" value={k.label} onChange={(v) => edit((d) => { d.keyDates![i].label = v; })} />
                  <Pair label="When" value={k.date} onChange={(v) => edit((d) => { d.keyDates![i].date = v; })} />
                  <button type="button" className="ed-x" onClick={() => edit((d) => { d.keyDates!.splice(i, 1); })}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn ghost" onClick={() => edit((d) => { (d.keyDates ??= []).push({ label: blankL(), date: blankL() }); })}>+ Add date</button>
            </section>

            <section className="adm-panel">
              <h2>What was included</h2>
              {draft.perks.map((p, i) => (
                <div className="ed-item-row" key={i}>
                  <Pair label="Item" multiline value={p} onChange={(v) => edit((d) => { d.perks[i] = v; })} />
                  <button type="button" className="ed-x" onClick={() => edit((d) => { d.perks.splice(i, 1); })}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn ghost" onClick={() => edit((d) => { d.perks.push(blankL()); })}>+ Add item</button>
            </section>

            <section className="adm-panel">
              <h2>Committees</h2>
              {draft.committees.map((c: Committee, i: number) => (
                <div className="ed-item-row ed-committee" key={c.slug + i}>
                  <b>Committee {i + 1}</b>
                  <Pair label="Name (e.g. Security Council)" value={c.body} onChange={(v) => edit((d) => { d.committees[i].body = v; })} />
                  <Pair label="Agenda / topic" multiline value={c.agenda} onChange={(v) => edit((d) => { d.committees[i].agenda = v; })} />
                  <Pair label="About this committee" multiline value={c.about} onChange={(v) => edit((d) => { d.committees[i].about = v; })} />
                  <Pair label="Working language (optional)" value={c.language ?? blankL()} onChange={(v) => edit((d) => { d.committees[i].language = v; })} />
                  <div>
                    <div className="ed-label">Chairs</div>
                    {(c.chairs ?? []).map((ch: Chair, j: number) => (
                      <div className="ed-inline" key={j}>
                        <select aria-label="Role" value={ch.role} onChange={(e) => edit((d) => { d.committees[i].chairs![j].role = e.target.value as Chair["role"]; })}>
                          <option value="head">Head Chair</option>
                          <option value="co">Co-Chair</option>
                        </select>
                        <input aria-label="Chair name" placeholder="Full name" value={ch.name} onChange={(e) => edit((d) => { d.committees[i].chairs![j].name = e.target.value; })} />
                        <button type="button" className="ed-x" onClick={() => edit((d) => { d.committees[i].chairs!.splice(j, 1); })}>Remove</button>
                      </div>
                    ))}
                    <button type="button" className="btn ghost" onClick={() => edit((d) => { (d.committees[i].chairs ??= []).push({ role: "head", name: "" }); })}>+ Add chair</button>
                  </div>
                  <div>
                    <div className="ed-label">Photos of this committee</div>
                    <div className="ed-cphotos">
                      {(c.images ?? []).map((im, k) => (
                        <div className="ed-cphoto" key={im.url + k}>
                          <img src={im.url} alt="" style={{ objectPosition: im.focus ? `${im.focus.x}% ${im.focus.y}%` : undefined }} />
                          <div className="ed-btns">
                            <button type="button" onClick={() => setOpenPicker(openPicker === `c-${i}-${k}` ? null : `c-${i}-${k}`)}>{openPicker === `c-${i}-${k}` ? "Close" : "Crop"}</button>
                            <button type="button" onClick={() => edit((d) => { d.committees[i].images!.splice(k, 1); })}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(c.images ?? []).map((im, k) => openPicker === `c-${i}-${k}` && (
                      <FocusPicker
                        key={`fp-${im.url}-${k}`}
                        src={im.url}
                        focus={im.focus}
                        onChange={(f) => edit((d) => { d.committees[i].images![k].focus = f; })}
                        boxes={COMMITTEE_BOXES}
                      />
                    ))}
                    <input type="file" accept="image/*" multiple onChange={(e) => { addPhotos(e.target.files, i); e.target.value = ""; }} />
                  </div>
                  <button type="button" className="ed-x" onClick={() => edit((d) => { d.committees.splice(i, 1); })}>Remove committee</button>
                </div>
              ))}
              <button
                type="button"
                className="btn ghost"
                onClick={() => edit((d) => { d.committees.push({ slug: "", body: blankL(), agenda: blankL(), about: blankL() }); })}
              >
                + Add committee
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Pair({ label, value, onChange, multiline }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean }) {
  const id = useId();
  const Field = multiline ? "textarea" : "input";
  const enRef = useRef<HTMLTextAreaElement>(null);
  const uzRef = useRef<HTMLTextAreaElement>(null);

  // Grow both boxes to fit their text, and keep the two languages the same height.
  useLayoutEffect(() => {
    if (!multiline) return;
    const fit = () => {
      const a = enRef.current, b = uzRef.current;
      if (!a || !b) return;
      a.style.height = "auto";
      b.style.height = "auto";
      const h = Math.max(a.scrollHeight, b.scrollHeight) + 2;
      a.style.height = h + "px";
      b.style.height = h + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [multiline, value.en, value.uz]);

  return (
    <div className="ed-pair">
      <div className="ed-label">{label}</div>
      <div className="ed-cols">
        <label htmlFor={`${id}-en`}><span>English</span>
          <Field ref={enRef as never} id={`${id}-en`} rows={multiline ? 2 : undefined} value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        </label>
        <label htmlFor={`${id}-uz`}><span>O&apos;zbek</span>
          <Field ref={uzRef as never} id={`${id}-uz`} rows={multiline ? 2 : undefined} value={value.uz} onChange={(e) => onChange({ ...value, uz: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

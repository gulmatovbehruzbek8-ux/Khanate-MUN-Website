"use client";

import { useCallback, useEffect, useState } from "react";

export type GalleryItem = { url: string; caption?: string };

/** Opens the viewer at `index`. Used by the cover image, which lives outside the grid. */
export function CoverImage({ item, index = 0 }: { item: GalleryItem; index?: number }) {
  return (
    <button
      type="button"
      className="zoom-btn"
      aria-label={item.caption || "Open photo"}
      onClick={() => window.dispatchEvent(new CustomEvent("kmun-open", { detail: index }))}
    >
      <img src={item.url} alt={item.caption || ""} />
    </button>
  );
}

/** Photo grid with an in-page viewer. `items` is the full list; the grid shows items from `from`. */
export default function Gallery({ items, from = 0, closeLabel = "Close" }: { items: GalleryItem[]; from?: number; closeLabel?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = items.length;

  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    const onOpen = (e: Event) => setOpen((e as CustomEvent<number>).detail);
    window.addEventListener("kmun-open", onOpen);
    return () => window.removeEventListener("kmun-open", onOpen);
  }, []);

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  const cur = open === null ? null : items[open];

  return (
    <>
      <div className="gallery">
        {items.slice(from).map((im, k) => (
          <button type="button" className="zoom-btn" key={im.url + k} onClick={() => setOpen(from + k)} aria-label={im.caption || "Open photo"}>
            <img src={im.url} alt={im.caption || ""} loading="lazy" />
            {im.caption && <span>{im.caption}</span>}
          </button>
        ))}
      </div>
      {cur && (
        <div className="lb" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <button type="button" className="lb-close" aria-label={closeLabel} onClick={() => setOpen(null)}>×</button>
          {n > 1 && <button type="button" className="lb-nav prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>}
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={cur.url} alt={cur.caption || ""} />
            {cur.caption && <figcaption>{cur.caption}</figcaption>}
          </figure>
          {n > 1 && <button type="button" className="lb-nav next" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>}
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { MAX_ZOOM, type Focus } from "@/lib/focus";

export type CropBox = { ratio: number; label: string; color: string };

export const SQUARE_BOX: CropBox[] = [{ ratio: 1, label: "Photo", color: "#0e7c7b" }];
export const SEASON_BOXES: CropBox[] = [
  { ratio: 4 / 3, label: "Gallery", color: "#0e7c7b" },
  { ratio: 2, label: "Cover", color: "#c9781f" },
];
export const COMMITTEE_BOXES: CropBox[] = [{ ratio: 4 / 3, label: "Gallery", color: "#0e7c7b" }];

const AREA_W = 360; // width of the photo preview in px

/**
 * Shows the whole photo with a box drawn right on top of it for each place the site crops
 * this photo — that box is exactly what stays visible there. Click or drag on the photo to
 * move the boxes; the slider changes their size (the shape never changes). Zoomed all the way
 * out, the box covers the entire photo.
 */
export default function FocusPicker({
  src,
  focus,
  onChange,
  boxes = SQUARE_BOX,
}: {
  src: string;
  focus?: Focus;
  onChange: (f: Focus) => void;
  boxes?: CropBox[];
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [text, setText] = useState<string | null>(null); // what's being typed in the % box
  const f = focus ?? { x: 50, y: 50 };
  const zoom = f.zoom ?? 1;
  const imageAspect = natural ? natural.w / natural.h : 1;

  // Size of each box at zoom 1, as a fraction of the photo (the largest box of that shape that fits).
  const base = boxes.map((b) => ({
    b,
    wNorm: imageAspect > b.ratio ? b.ratio / imageAspect : 1,
    hNorm: imageAspect > b.ratio ? 1 : imageAspect / b.ratio,
  }));
  // Zoomed out far enough that every box contains the whole photo.
  const minZoom = Math.min(1, ...base.map((x) => Math.min(x.wNorm, x.hNorm)));
  // Boxes can poke out past the photo when zoomed out, so leave room around it.
  const padX = Math.round(Math.max(0, ...base.map((x) => x.wNorm / minZoom - 1)) * AREA_W);
  const padY = Math.round(Math.max(0, ...base.map((x) => x.hNorm / minZoom - 1)) * (AREA_W / imageAspect));

  function pick(el: HTMLElement, clientX: number, clientY: number) {
    const r = el.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)));
    onChange({ x, y, ...(f.zoom ? { zoom: f.zoom } : {}) });
  }

  function setZoom(z: number) {
    const clamped = Math.max(minZoom, Math.min(MAX_ZOOM, z));
    const next: Focus = { x: f.x, y: f.y };
    if (Math.abs(clamped - 1) >= 0.01) next.zoom = Math.round(clamped * 100) / 100;
    onChange(next);
  }

  return (
    <div className="focus-pick">
      <div className="focus-stage" style={{ padding: `${padY}px ${padX}px` }}>
        <div
          className="focus-area"
          style={{ width: AREA_W }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.currentTarget, e.clientX, e.clientY); }}
          onPointerMove={(e) => { if (e.buttons === 1) pick(e.currentTarget, e.clientX, e.clientY); }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
          {natural &&
            base.map(({ b, wNorm, hNorm }) => {
              // exactly what the site shows for this crop: the zoom-1 box, shrunk by the zoom and anchored at the focus point
              const w = wNorm / zoom;
              const h = hNorm / zoom;
              const left = (1 - w) * (f.x / 100) * 100;
              const top = (1 - h) * (f.y / 100) * 100;
              return (
                <div
                  key={b.label}
                  className="focus-box"
                  style={{ left: `${left}%`, top: `${top}%`, width: `${w * 100}%`, height: `${h * 100}%`, borderColor: b.color }}
                >
                  <span style={{ background: b.color }}>{b.label}</span>
                </div>
              );
            })}
        </div>
      </div>
      <label className="focus-zoom">
        <span>Crop size</span>
        <input
          type="range"
          min={minZoom}
          max={Math.min(MAX_ZOOM, 4)}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
        />
        <span className="focus-pct">
          <input
            type="number"
            inputMode="numeric"
            min={Math.ceil(minZoom * 100)}
            max={MAX_ZOOM * 100}
            step={1}
            value={text ?? String(Math.round(zoom * 100))}
            aria-label="Crop size in percent"
            onChange={(e) => {
              setText(e.target.value);
              const v = Number(e.target.value);
              if (e.target.value !== "" && Number.isFinite(v) && v > 0) setZoom(v / 100);
            }}
            onBlur={() => setText(null)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setText(null); } }}
          />
          %
        </span>
      </label>
      <div className="focus-row">
        <span className="focus-hint">Click or drag on the photo to move the box. Slide left to show more of the photo, right to zoom in. The shape stays the same.</span>
        {(focus && (focus.x !== 50 || focus.y !== 50 || focus.zoom)) && (
          <button type="button" className="ed-x" onClick={() => onChange({ x: 50, y: 50 })}>Reset</button>
        )}
      </div>
    </div>
  );
}

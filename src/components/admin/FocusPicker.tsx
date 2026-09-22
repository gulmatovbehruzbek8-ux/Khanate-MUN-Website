"use client";

import { useState } from "react";
import type { Focus } from "@/lib/focus";

export type CropBox = { ratio: number; label: string; color: string };

export const SQUARE_BOX: CropBox[] = [{ ratio: 1, label: "Photo", color: "#0e7c7b" }];
export const SEASON_BOXES: CropBox[] = [
  { ratio: 4 / 3, label: "Gallery", color: "#0e7c7b" },
  { ratio: 2, label: "Cover", color: "#c9781f" },
];
export const COMMITTEE_BOXES: CropBox[] = [{ ratio: 4 / 3, label: "Gallery", color: "#0e7c7b" }];

/**
 * Shows the photo full-size with a box drawn right on top of it for each
 * place the site crops this photo — that box is exactly what stays visible
 * there. Click or drag anywhere on the photo to move the boxes.
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
  const f = focus ?? { x: 50, y: 50 };
  const imageAspect = natural ? natural.w / natural.h : 1;

  function pick(el: HTMLElement, clientX: number, clientY: number) {
    const r = el.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)));
    onChange({ x, y });
  }

  return (
    <div className="focus-pick">
      <div
        className="focus-area"
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
          boxes.map((b) => {
            // The largest ratio-shaped rectangle that fits inside the photo, i.e. exactly
            // what object-fit: cover shows when this photo is cropped to that shape.
            const wNorm = imageAspect > b.ratio ? b.ratio / imageAspect : 1;
            const hNorm = imageAspect > b.ratio ? 1 : imageAspect / b.ratio;
            const left = (1 - wNorm) * (f.x / 100) * 100;
            const top = (1 - hNorm) * (f.y / 100) * 100;
            return (
              <div
                key={b.label}
                className="focus-box"
                style={{ left: `${left}%`, top: `${top}%`, width: `${wNorm * 100}%`, height: `${hNorm * 100}%`, borderColor: b.color }}
              >
                <span style={{ background: b.color }}>{b.label}</span>
              </div>
            );
          })}
      </div>
      <div className="focus-row">
        <span className="focus-hint">Click or drag on the photo — each box is exactly what stays visible there on the site.</span>
        {focus && <button type="button" className="ed-x" onClick={() => onChange({ x: 50, y: 50 })}>Reset to center</button>}
      </div>
    </div>
  );
}

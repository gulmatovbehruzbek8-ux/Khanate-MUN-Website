"use client";

import { useRef } from "react";
import type { Focus } from "@/lib/focus";

/**
 * Click or drag on the photo to choose which part stays visible when the site
 * crops it. Shows the crop live at the aspect ratios the photo actually gets
 * shown at, so what you see here is what visitors see.
 */
export default function FocusPicker({
  src,
  focus,
  onChange,
  previewRatios = ["4/3", "16/8"],
}: {
  src: string;
  focus?: Focus;
  onChange: (f: Focus) => void;
  previewRatios?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const f = focus ?? { x: 50, y: 50 };

  function pick(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)));
    onChange({ x, y });
  }

  return (
    <div className="focus-pick">
      <div
        ref={ref}
        className="focus-area"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons === 1) pick(e.clientX, e.clientY); }}
      >
        <img src={src} alt="" draggable={false} />
        <span className="focus-dot" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      </div>
      <div className="focus-previews">
        {previewRatios.map((r) => (
          <div className="focus-preview" style={{ aspectRatio: r }} key={r}>
            <img src={src} alt="" style={{ objectPosition: `${f.x}% ${f.y}%` }} />
          </div>
        ))}
      </div>
      <div className="focus-row">
        <span className="focus-hint">Click or drag on the photo to choose what stays visible when it&apos;s cropped.</span>
        {focus && <button type="button" className="ed-x" onClick={() => onChange({ x: 50, y: 50 })}>Reset to center</button>}
      </div>
    </div>
  );
}

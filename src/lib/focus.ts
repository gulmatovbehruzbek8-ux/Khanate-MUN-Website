import type { CSSProperties } from "react";

/**
 * A crop focus point as percentages of the image (0,0 = top-left, 100,100 = bottom-right),
 * plus an optional zoom (1 = the default crop, above 1 = tighter, below 1 = zoomed out so the
 * whole photo shows). The crop shape (ratio) never changes — only how much of the photo it covers.
 */
export type Focus = { x: number; y: number; zoom?: number };

export const CENTER_FOCUS: Focus = { x: 50, y: 50 };

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 4;

/** Accepts untrusted JSON and returns a clean Focus, or undefined. */
export function sanitizeFocus(v: unknown): Focus | undefined {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const out: Focus = { x: Math.max(0, Math.min(100, Math.round(x))), y: Math.max(0, Math.min(100, Math.round(y))) };
  const z = Number(o.zoom);
  if (Number.isFinite(z) && Math.abs(z - 1) > 0.005) out.zoom = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)) * 100) / 100;
  return out;
}

/**
 * CSS for an object-fit:cover <img> so it crops around `f` instead of the center.
 * With a zoom, the image is also scaled around the same point — the crop box then covers
 * 1/zoom of the default crop, anchored at (x%, y%). The image's parent must clip overflow.
 */
export function focusStyle(f?: Focus | null): CSSProperties | undefined {
  if (!f) return undefined;
  const style: CSSProperties = { objectPosition: `${f.x}% ${f.y}%` };
  if (f.zoom && Math.abs(f.zoom - 1) > 0.005) {
    style.scale = f.zoom;
    style.transformOrigin = `${f.x}% ${f.y}%`;
  }
  return style;
}

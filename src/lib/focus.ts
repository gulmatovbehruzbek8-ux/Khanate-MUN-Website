/** A crop focus point as percentages of the image (0,0 = top-left, 100,100 = bottom-right). */
export type Focus = { x: number; y: number };

export const CENTER_FOCUS: Focus = { x: 50, y: 50 };

/** Accepts untrusted JSON and returns a clean Focus, or undefined. */
export function sanitizeFocus(v: unknown): Focus | undefined {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x: Math.max(0, Math.min(100, Math.round(x))), y: Math.max(0, Math.min(100, Math.round(y))) };
}

/** CSS for an object-fit:cover <img> so it crops around `f` instead of the center. */
export function focusStyle(f?: Focus | null): { objectPosition: string } | undefined {
  return f ? { objectPosition: `${f.x}% ${f.y}%` } : undefined;
}

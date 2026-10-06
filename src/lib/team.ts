import { unstable_cache } from "next/cache";
import { cache } from "react";
import { site } from "@/content/site";
import type { Focus } from "@/lib/focus";
import { sanitizeFocus } from "@/lib/focus";
import { isSafeImageUrl } from "./seasons";
import { DATA_TAG } from "./settings";
import { getStore } from "./store";

export interface Member {
  name: string;
  role: string;
  photo: string | null;
  focus?: Focus;
}

const KEY = "team";

const readContent = unstable_cache(async () => (await getStore()?.getContent()) ?? {}, ["kmun-content-team"], {
  revalidate: 3600,
  tags: [DATA_TAG],
});

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Accepts untrusted JSON and returns a clean member list. */
export function sanitizeTeam(input: unknown): Member[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 60)
    .map((raw) => {
      const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const photo = str(o.photo, 600);
      return {
        name: str(o.name, 80),
        role: str(o.role, 80),
        photo: photo && isSafeImageUrl(photo) ? photo : null,
        focus: sanitizeFocus(o.focus),
      };
    })
    .filter((m) => m.name);
}

/** The team always comes from the defaults in src/content/site.ts, so a committed change is live right after deploy. */
export const getTeam = cache(async (): Promise<Member[]> => site.team);

export async function saveTeam(team: Member[]) {
  const store = getStore();
  if (!store) throw new Error("No store configured");
  await store.setContent(KEY, JSON.stringify(team));
}

/** Remove the saved team so the defaults show again. */
export async function resetTeam() {
  const store = getStore();
  if (!store) throw new Error("No store configured");
  await store.setContent(KEY, null);
}

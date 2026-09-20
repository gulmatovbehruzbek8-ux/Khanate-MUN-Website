/**
 * Everything the organisers are likely to edit lives here.
 * Text translations live in src/lib/dictionaries.ts.
 */
export const site = {
  name: "KhanateMUN",

  // No date announced yet. When the next season is confirmed, set startsAt (ISO 8601, Tashkent is +05:00,
  // e.g. "2027-03-21T09:00:00+05:00") and registrationOpen: true. The countdown then appears automatically.
  nextSeason: {
    startsAt: null as string | null,
    registrationOpen: false,
  },

  // Facts about the most recent conference, shown on the About page.
  lastSeason: {
    dateLabel: "22 · 03 · 2026",
    city: "Khiva",
    committeeCount: 4,
  },

  social: {
    telegram: "https://t.me/KhanateMUN_Official",
    instagram: "https://instagram.com/khanatemun_official",
  },

  fees: [
    { key: "delegate_meal", uzs: 85000 },
    { key: "observer", uzs: 20000 },
  ] as const,

  // title/desc are keys in the dictionaries.
  committees: [
    { body: "General Assembly", title: "c1", desc: "c1d" },
    { body: "Security Council", title: "c2", desc: "c2d" },
    { body: "ECOSOC", title: "c3", desc: "c3d" },
    { body: "GA · Uzbek Committee", title: "c4", desc: "c4d" },
  ] as const,

  // Season 2 team, from the channel's "Meet the Team" posts. Add last names/photos (put photos in /public/team).
  team: [
    { name: "Olloshukur", role: "Secretary-General & Founder", photo: null },
    { name: "Ruxshona", role: "Delegate Affairs Officer", photo: null },
    { name: "Ibrat", role: "Financier", photo: null },
    { name: "Mohira", role: "Logistician & Session Manager", photo: null },
    { name: "Mushtariy", role: "Logistician", photo: null },
    { name: "Shaxrizoda", role: "Logistician", photo: null },
    { name: "Behruz", role: "Operator (photo & media)", photo: null },
    { name: "Islombek", role: "Designs & PR Manager", photo: null },
  ] as { name: string; role: string; photo: string | null }[],
};

export type TicketKey = (typeof site.fees)[number]["key"];

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
  ] as const,

  // title/desc are keys in the dictionaries.
  committees: [
    { body: "General Assembly", title: "c1", desc: "c1d" },
    { body: "Security Council", title: "c2", desc: "c2d" },
    { body: "ECOSOC", title: "c3", desc: "c3d" },
    { body: "GA · Uzbek Committee", title: "c4", desc: "c4d" },
  ] as const,

  // Team, in the order shown in the team chat. Add photos by putting them in /public/team and setting `photo`.
  team: [
    { name: "Olloshukur Karimboyev", role: "Founder (CEO)", photo: null },
    { name: "Odilbek Matkarimov", role: "Finance Manager", photo: null },
    { name: "Shahrizoda Komiljanova", role: "PR Lead", photo: null },
    { name: "Islombek Otaboyev", role: "Designs Lead", photo: null },
    { name: "Bunyodbek Islomboyev", role: "Head Logistician", photo: null },
    { name: "Behruzbek Gulmatov", role: "Chief Operator", photo: null },
    { name: "Abbos Saitjonov", role: "Media Manager", photo: null },
    { name: "Ruxshona Aminboyeva", role: "Delegate Affairs Officer (DAO)", photo: null },
    { name: "Zuhra Ibadullayeva", role: "Logistician", photo: null },
    { name: "Mohira Ulug'bekova", role: "Logistician", photo: null },
    { name: "Mushtariy Masharipova", role: "Logistician", photo: null },
  ] as { name: string; role: string; photo: string | null }[],
};

export type TicketKey = (typeof site.fees)[number]["key"];

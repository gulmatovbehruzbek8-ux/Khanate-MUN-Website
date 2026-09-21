/**
 * Past and current conferences. Facts come from the official Telegram channel.
 * Every visible string is { en, uz }. Add a new season by copying an entry.
 */
export type L = { en: string; uz: string };

export type Chair = { role: "head" | "co"; name: string };

export type SeasonImage = { url: string; caption?: L };

export type Committee = {
  slug: string;
  body: L; // e.g. "General Assembly"
  agenda: L; // the topic debated
  about: L; // what this UN body does
  language?: L;
  chairs?: Chair[];
  images?: SeasonImage[];
};

export type Season = {
  slug: string;
  number: number;
  title: L;
  date: L;
  venue: L;
  summary: L;
  fees: { label: L; uzs: number | 0; free?: boolean }[];
  keyDates?: { label: L; date: L }[];
  perks: L[];
  committees: Committee[];
  images?: SeasonImage[]; // first image is the cover
};

const GA: L = {
  en: "The General Assembly is the UN's main deliberative body, where every member state has one vote. Delegates debate broad global issues and draft resolutions.",
  uz: "Bosh Assambleya — BMTning asosiy muhokama organi bo'lib, unda har bir a'zo davlatning bitta ovozi bor. Delegatlar keng global masalalarni muhokama qilib, rezolyutsiyalar tayyorlaydi.",
};
const SC: L = {
  en: "The Security Council is responsible for international peace and security. It has five permanent members with veto power and ten elected members.",
  uz: "Xavfsizlik Kengashi xalqaro tinchlik va xavfsizlik uchun mas'ul. Unda veto huquqiga ega beshta doimiy va o'nta saylanadigan a'zo bor.",
};
const ECOSOC: L = {
  en: "The Economic and Social Council coordinates the UN's work on economic, social and environmental issues such as development, health and technology.",
  uz: "Iqtisodiy va Ijtimoiy Kengash BMTning iqtisodiy, ijtimoiy va ekologik masalalar — rivojlanish, sog'liqni saqlash va texnologiya — bo'yicha ishini muvofiqlashtiradi.",
};

export const defaultSeasons: Season[] = [
  {
    slug: "season-2",
    number: 2,
    title: { en: "Season 2", uz: "2-mavsum" },
    date: { en: "22 March 2026", uz: "2026-yil 22-mart" },
    venue: {
      en: "Khiva Presidential School, Amir Temur Street, Khiva",
      uz: "Xiva Prezident maktabi, Amir Temur ko'chasi, Xiva",
    },
    summary: {
      en: "Season 2 came back reimagined: four committees, a guided tour of Itchan Qala after the sessions free accommodation for out-of-town delegates and a referral programme.",
      uz: "2-mavsum yangicha qaytdi: to'rtta qo'mita, sessiyalardan keyin Ichan Qal'a bo'ylab ekskursiya boshqa shahardan kelgan delegatlar uchun bepul turar joy va referal dasturi.",
    },
    fees: [
      { label: { en: "Delegate", uz: "Delegat" }, uzs: 85000 },
      { label: { en: "Observer", uz: "Kuzatuvchi" }, uzs: 20000 },
    ],
    keyDates: [
      { label: { en: "Original application deadline", uz: "Arizalarning dastlabki muddati" }, date: { en: "1 March", uz: "1-mart" } },
      { label: { en: "Deadline extended to", uz: "Muddat uzaytirildi" }, date: { en: "7 March", uz: "7-mart" } },
      { label: { en: "Conference day", uz: "Konferensiya kuni" }, date: { en: "22 March", uz: "22-mart" } },
    ],
    perks: [
      { en: "Free accommodation at Khiva Presidential School for out-of-town delegates", uz: "Boshqa shahardan kelgan delegatlar uchun Xiva Prezident maktabida bepul turar joy" },
      { en: "One-hour guided tour of Itchan Qala after the conference", uz: "Konferensiyadan keyin Ichan Qal'a bo'ylab bir soatlik ekskursiya" },
      { en: "Referral system: 10 000 UZS back per referral, up to 2 referrals", uz: "Referal tizimi: har bir taklif uchun 10 000 so'm qaytadi, 2 tagacha" },
    ],
    images: [
      { url: "/seasons/season-2/group.jpg", caption: { en: "Delegates and chairs with their certificates", uz: "Delegatlar va raislar sertifikatlari bilan" } },
      { url: "/seasons/season-2/awards.jpg", caption: { en: "Award ceremony", uz: "Taqdirlash marosimi" } },
      { url: "/seasons/season-2/discussion.jpg", caption: { en: "Delegates at work during a session", uz: "Sessiya davomida delegatlar ishda" } },
      { url: "/seasons/season-2/committee.jpg", caption: { en: "In the committee room", uz: "Qo'mita xonasida" } },
      { url: "/seasons/season-2/team.jpg", caption: { en: "Season 2 behind the scenes", uz: "2-mavsum sahna ortida" } },
    ],
    committees: [
      {
        slug: "s2-ga",
        body: { en: "General Assembly", uz: "Bosh Assambleya" },
        agenda: {
          en: "The Global Impact of Disinformation and Fake News on Democracy",
          uz: "Dezinformatsiya va soxta yangiliklarning demokratiyaga global ta'siri",
        },
        about: GA,
      },
      {
        slug: "s2-sc",
        body: { en: "Security Council", uz: "Xavfsizlik Kengashi" },
        agenda: {
          en: "Addressing the Ongoing Conflict in Ukraine and Its Global Security Implications",
          uz: "Ukrainadagi davom etayotgan mojaro va uning global xavfsizlikka ta'sirini hal etish",
        },
        about: SC,
      },
      {
        slug: "s2-ecosoc",
        body: { en: "ECOSOC", uz: "ECOSOC" },
        agenda: {
          en: "Bridging the Global Digital Divide: Expanding Internet Access in Developing Nations",
          uz: "Global raqamli tengsizlikni bartaraf etish: rivojlanayotgan mamlakatlarda internetga kirishni kengaytirish",
        },
        about: ECOSOC,
      },
      {
        slug: "s2-ga-uz",
        body: { en: "General Assembly · Uzbek Committee", uz: "Bosh Assambleya · O'zbek qo'mitasi" },
        agenda: {
          en: "Climate Change and Its Impact on Developing Nations",
          uz: "Iqlim o'zgarishi va uning rivojlanayotgan davlatlarga ta'siri",
        },
        about: GA,
        language: { en: "Uzbek", uz: "O'zbek tili" },
      },
    ],
  },
  {
    slug: "season-1",
    number: 1,
    title: { en: "Season 1", uz: "1-mavsum" },
    date: { en: "August 2025", uz: "2025-yil avgust" },
    venue: { en: "Khiva Presidential School, Khiva", uz: "Xiva Prezident maktabi, Xiva" },
    summary: {
      en: "The first Model UN in Khiva and in all of Khorezm, built by students for students, held in partnership with UZBMUN. Three committees, chairs recruited from the community, and an evening tour of Itchan Kala.",
      uz: "Xiva va butun Xorazmdagi birinchi Model BMT — o'quvchilar tomonidan o'quvchilar uchun, UZBMUN hamkorligida o'tkazildi. Uchta qo'mita, jamoadan tanlangan raislar va Ichan Qal'a bo'ylab kechki ekskursiya.",
    },
    fees: [
      { label: { en: "Delegate", uz: "Delegat" }, uzs: 50000 },
      { label: { en: "Chair", uz: "Rais" }, uzs: 0, free: true },
      { label: { en: "Accommodation, per day", uz: "Turar joy, bir kun uchun" }, uzs: 10000 },
    ],
    perks: [
      { en: "Evening tour of Itchan Kala, 7–9 PM", uz: "Ichan Qal'a bo'ylab kechki ekskursiya, 19:00–21:00" },
      { en: "Held in partnership with UZBMUN", uz: "UZBMUN hamkorligida o'tkazildi" },
    ],
    committees: [
      {
        slug: "s1-ga",
        body: { en: "General Assembly", uz: "Bosh Assambleya" },
        agenda: {
          en: "Addressing the Global Water Crisis & Ensuring Access to Clean Water for All",
          uz: "Global suv inqirozini hal etish va hamma uchun toza suvdan foydalanishni ta'minlash",
        },
        about: GA,
        chairs: [
          { role: "head", name: "Malika Fazilova" },
          { role: "co", name: "Jasurbek Sadullayev" },
        ],
      },
      {
        slug: "s1-sc",
        body: { en: "Security Council", uz: "Xavfsizlik Kengashi" },
        agenda: {
          en: "The India–Pakistan Conflict: Ensuring Peace and Stability in South Asia",
          uz: "Hindiston–Pokiston mojarosi: Janubiy Osiyoda tinchlik va barqarorlikni ta'minlash",
        },
        about: SC,
        chairs: [
          { role: "head", name: "Jasmina Mangliboyeva" },
          { role: "co", name: "Ruxshona Aminboyeva" },
        ],
      },
      {
        slug: "s1-ecosoc",
        body: { en: "ECOSOC", uz: "ECOSOC" },
        agenda: {
          en: "Fostering Youth Employment and Innovation for Sustainable Development",
          uz: "Barqaror rivojlanish uchun yoshlar bandligi va innovatsiyani rag'batlantirish",
        },
        about: ECOSOC,
        chairs: [
          { role: "head", name: "Mahliyo Murodova" },
          { role: "co", name: "Sevinchoy Otaboyeva" },
        ],
      },
    ],
  },
];

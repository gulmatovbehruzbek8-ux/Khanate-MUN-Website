import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { faq } from "@/content/faq";
import { getSettings } from "@/lib/settings";
import { escapeHtml, sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 30;

const fmt = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} UZS`;

function siteUrl() {
  return (
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  );
}

/** Builds the reply for a command. Every answer is given in English and Uzbek. */
async function reply(cmd: string, chatId: number): Promise<string> {
  const url = siteUrl();
  const reg = url ? `${url}/en/register` : "";
  switch (cmd) {
    case "/start":
    case "/help":
      return [
        "<b>KhanateMUN</b> — Model UN in Khiva",
        "Commands: /register /prices /date /faq /channel",
        "",
        "<b>KhanateMUN</b> — Xivadagi Model BMT",
        "Buyruqlar: /register /prices /date /faq /channel",
      ].join("\n");
    case "/register": {
      const s = await getSettings();
      const link = reg ? `\n${reg}` : "";
      return s.registrationOpen
        ? `Registration is open. Sign up here:${link}\n\nRo'yxatdan o'tish ochiq:${link}`
        : "Registration is closed right now. Follow the channel for news.\n\nRo'yxatdan o'tish hozircha yopiq. Yangiliklar uchun kanalni kuzating.\n" +
            site.social.telegram;
    }
    case "/prices": {
      const s = await getSettings();
      return `Delegate: ${fmt(s.feeDelegate)}\nObserver: ${fmt(s.feeObserver)}\n\nDelegat: ${fmt(s.feeDelegate)}\nKuzatuvchi: ${fmt(s.feeObserver)}`;
    }
    case "/date": {
      const s = await getSettings();
      if (!s.nextSeasonStart) return "The next season's date is not announced yet.\n\nKeyingi mavsum sanasi hali e'lon qilinmagan.";
      const dt = new Date(s.nextSeasonStart).toLocaleString("en-GB", { timeZone: "Asia/Tashkent", dateStyle: "long", timeStyle: "short" });
      return `Next season starts: ${dt} (Tashkent time)\n\nKeyingi mavsum: ${dt} (Toshkent vaqti)`;
    }
    case "/faq":
      return faq
        .slice(0, 5)
        .map((f) => `<b>${escapeHtml(f.q.en)}</b>\n${escapeHtml(f.a.en)}`)
        .join("\n\n") + (siteUrl() ? `\n\n${siteUrl()}/en/faq` : "");
    case "/channel":
      return `${site.social.telegram}\n${site.social.instagram}`;
    case "/chatid":
      // Used once during setup to find the organisers' group id for TELEGRAM_CHAT_ID.
      return `Chat ID: <code>${chatId}</code>`;
    default:
      return "Send /help to see what I can do.\n\n/help buyrug'ini yuboring.";
  }
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await req.json();
    const msg = update?.message;
    const text: string | undefined = msg?.text;
    if (text && msg?.chat?.id && text.startsWith("/")) {
      const cmd = text.split(/[\s@]/)[0].toLowerCase(); // "/prices@KhanateBot" -> "/prices"
      await sendTelegram(msg.chat.id, await reply(cmd, msg.chat.id));
    }
  } catch (err) {
    console.error("[telegram] webhook error", err);
  }
  return NextResponse.json({ ok: true }); // always 200 so Telegram does not retry
}

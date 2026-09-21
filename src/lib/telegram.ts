const API = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

/** Sends an HTML message. Never throws: a Telegram problem must never break the website. */
export async function sendTelegram(chatId: string | number, html: string, opts: { silent?: boolean } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: opts.silent ?? false,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error("[telegram] sendMessage failed", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (err) {
    console.error("[telegram] sendMessage error", err);
    return false;
  }
}

/** Tells the organisers' chat about a new registration (needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID). */
export async function notifyNewRegistration(r: {
  name: string;
  school: string;
  telegram: string;
  ticket: string;
  fee: string;
  committee: string;
  referral: string;
}) {
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!chat || !telegramConfigured()) return;
  const lines = [
    "<b>New KhanateMUN registration</b>",
    `Name: ${esc(r.name)}`,
    r.school && `School: ${esc(r.school)}`,
    `Telegram: ${esc(r.telegram)}`,
    `Ticket: ${esc(r.ticket)} · ${esc(r.fee)} UZS`,
    r.committee && `Committee: ${esc(r.committee)}`,
    r.referral && `Referral: ${esc(r.referral)}`,
  ].filter(Boolean);
  await sendTelegram(chat, lines.join("\n"));
}

export { esc as escapeHtml };

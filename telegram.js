import 'dotenv/config';

const TG_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

export async function sendMessage(text) {
  const res = await fetch(
    `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    }
  );

  const data = await res.json();

  if (!data.ok) {
    console.error('Telegram error:', data);
  }
}

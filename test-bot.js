import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import { getTranscript } from './transcript.js';
import { summarize } from './gemini.js';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    request: { agentOptions: { family: 4 } } 
});

const myChatId = process.env.TG_CHAT_ID;

// Функция для разбивки длинных сообщений
async function sendLongMessage(chatId, text) {
  // Разбиваем текст на куски по 4000 символов
  const chunks = text.match(/[\s\S]{1,4000}/g) || [];
  
  for (const chunk of chunks) {
    try {
      // Пытаемся отправить с Markdown
      await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    } catch (e) {
      console.warn("⚠️ Ошибка Markdown, отправляю как обычный текст...");
      // Если Markdown сломался, отправляем просто как текст (без форматирования)
      await bot.sendMessage(chatId, chunk); 
    }
  }
}

async function testFullFlow(videoId) {
    console.log(`🚀 Запуск теста для: ${videoId}`);
    try {
        const transcript = await getTranscript(videoId);
        if (!transcript) return console.log("❌ Нет текста");

        console.log("🤖 Gemini анализирует...");
        const summary = await summarize(transcript);

        const finalReport = `✅ **ТЕСТОВЫЙ ОТЧЕТ**\n\n${summary}\n\n🔗 https://www.youtube.com/watch?v=${videoId}`;
        
        await sendLongMessage(myChatId, finalReport);
        console.log("🏁 Успех! Проверь Telegram.");

    } catch (error) {
        console.error("💥 Ошибка:", error.message);
    }
}

testFullFlow('X292qHozE6k');
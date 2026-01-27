import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import fs from 'fs';
import { getTranscript } from './transcript.js';
import { summarize } from './gemini.js';
import { getLatestVideos } from './youtube.js';
import { CHANNELS } from './channels.js';

const token = process.env.TELEGRAM_TOKEN;
const myChatId = process.env.TG_CHAT_ID;
const bot = new TelegramBot(token, { polling: true });

const SENT_VIDEOS_FILE = './sent_videos.json';
let sentVideos = [];

if (fs.existsSync(SENT_VIDEOS_FILE)) {
  try {
    sentVideos = JSON.parse(fs.readFileSync(SENT_VIDEOS_FILE));
  } catch (e) { sentVideos = []; }
}

async function sendLongMessage(chatId, text) {
  const maxLength = 4000;
  const chunks = text.match(/[\s\S]{1,4000}/g) || [];
  for (const chunk of chunks) {
    try {
      await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    } catch (e) {
      await bot.sendMessage(chatId, chunk);
    }
  }
}

async function checkChannels(isFirstRun = false) {
  const now = new Date();
  console.log(`\n🔍 [${now.toLocaleTimeString()}] Проверка обновлений...`);
  
  for (const channel of CHANNELS) {
    try {
      // Берем последние 3 видео для скорости
      const videos = await getLatestVideos(channel.id, 3); 
      
      for (const video of videos) {
        if (!sentVideos.includes(video.videoId)) {
          
          if (isFirstRun) {
            // Просто запоминаем ID при первом включении
            sentVideos.push(video.videoId);
            continue;
          }

          console.log(`🆕 Поймали новое видео: ${video.title}`);
          
          // Отправляем уведомление с отметкой времени
          const timeLabel = `[⏱ ${new Date().toLocaleTimeString()}]`;
          await bot.sendMessage(myChatId, `${timeLabel} 🆕 **НОВОЕ ВИДЕО: ${channel.name}**\n\n"${video.title}"\n\n⏳ Начинаю финансовый анализ...`);

          const transcript = await getTranscript(video.videoId);
          
          if (transcript) {
            const summary = await summarize(transcript);
            const finalReport = `✅ **ОТЧЕТ ГОТОВ**\nКанал: #${channel.name.replace(/\s+/g, '_')}\nВидео: ${video.title}\n\n${summary}\n\n🔗 https://www.youtube.com/watch?v=${video.videoId}`;
            
            await sendLongMessage(myChatId, finalReport);

            sentVideos.push(video.videoId);
            fs.writeFileSync(SENT_VIDEOS_FILE, JSON.stringify(sentVideos));
          }
        }
      }
    } catch (error) {
      console.error(`❌ Ошибка ${channel.name}:`, error.message);
    }
  }

  if (isFirstRun) {
    fs.writeFileSync(SENT_VIDEOS_FILE, JSON.stringify(sentVideos));
    console.log("✅ База данных обновлена. Теперь бот пришлет только НОВЫЕ видео.");
  }
}

// 1. При запуске просто сканируем каналы и молчим
checkChannels(true);

// 2. Каждые 15 минут проверяем на предмет новинок
const INTERVAL = 15 * 60 * 1000;
setInterval(() => checkChannels(false), INTERVAL);

bot.onText(/\/check/, () => {
  bot.sendMessage(myChatId, "🔄 Проверяю каналы вручную...");
  checkChannels(false);
});

console.log("🚀 Бот-монитор успешно запущен!");
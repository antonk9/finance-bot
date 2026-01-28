import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

export async function getTranscript(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const currentDir = process.cwd();
  const tempBaseName = `temp_${videoId}`;
  const tempPath = path.join(currentDir, tempBaseName);
  
  try {
    // 1. Скачиваем субтитры
    const cmd = `./yt-dlp --write-auto-sub --skip-download --sub-langs "en.*" -o "${tempPath}.%(ext)s" --no-warnings "${url}"`;
    await execPromise(cmd);

    // 2. Ищем файл
    const files = await fs.readdir(currentDir);
    const subtitleFile = files.find(f => f.startsWith(tempBaseName) && f.endsWith('.vtt'));

    if (!subtitleFile) return null;

    const fullPath = path.join(currentDir, subtitleFile);
    const rawText = await fs.readFile(fullPath, 'utf-8');

    // 3. Улучшенная очистка (специально для ваших файлов)
    const cleanText = rawText
      .replace(/WEBVTT[\s\S]*?\n\n/g, '')           // Убираем заголовок
      .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')   // Убираем внутристрочные метки <00:00:01.000>
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3} -->.*/g, '') // Убираем строки таймкодов
      .replace(/<\/?[^>]+(>|$)/g, "")                 // Убираем оставшиеся теги
      .replace(/\n+/g, ' ')                            // Схлопываем строки
      .replace(/\s+/g, ' ')                            // Убираем лишние пробелы
      .trim();

    // Удаляем временный файл
    await fs.unlink(fullPath).catch(() => {});

    // Важно: проверяем, что после очистки реально остался текст
    if (cleanText.length < 100) {
        console.log(`⚠️ Текст слишком короткий после очистки (${cleanText.length} симв.)`);
        return null;
    }

    return cleanText;

  } catch (e) {
    console.error(`❌ Ошибка:`, e.message);
    return null;
  }
}
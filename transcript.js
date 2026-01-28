import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function getTranscript(videoId) {
  const cleanId = videoId.includes('v=') ? videoId.split('v=')[1].split('&')[0] : videoId;
  
  try {
    console.log(`📥 Вызов CLI youtube-transcript-api для ${cleanId}...`);

    // Вызываем CLI напрямую. Он выдаст JSON, который мы легко распарсим.
    // Флаг --format text заставит его выдать чистый текст без лишней шелухи.
    const cmd = `youtube_transcript_api ${cleanId} --format text`;
    
    const { stdout } = await execPromise(cmd);

    const cleanText = stdout
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length < 50) {
      console.log('❌ Полученный текст слишком короткий.');
      return null;
    }

    console.log(`✅ Успех! Получено ${cleanText.length} символов.`);
    return cleanText;

  } catch (e) {
    console.error(`❌ Ошибка CLI:`, e.message);
    
    // Если команда не найдена, попробуем вызвать через python3 -m
    if (e.message.includes('not found')) {
       console.log("🔄 CLI не в PATH, пробуем через модуль...");
       try {
         const fallbackCmd = `python3 -m youtube_transcript_api ${cleanId} --format text`;
         const { stdout } = await execPromise(fallbackCmd);
         return stdout.replace(/\s+/g, ' ').trim();
       } catch (err2) {
         console.error("❌ И через модуль не вышло.");
       }
    }
    return null;
  }
}
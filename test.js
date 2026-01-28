import { getTranscript } from './transcript.js';

// ПЕРЕДАЕМ ТОЛЬКО ID, так как твой transcript.js, судя по логам, 
// сам добавляет "https://www.youtube.com/watch?v=" к аргументу
const videoId = 'X292qHozE6k'; 

async function runTest() {
    console.log('🚀 Запуск теста парсинга...');
    console.log(`🆔 Передаем в функцию ID: ${videoId}`);

    try {
        const text = await getTranscript(videoId);

        if (text) {
            console.log('✅ УСПЕХ!');
            console.log('📝 Длина текста:', text.length);
            console.log('📝 Начало текста:', text.substring(0, 200));
        } else {
            console.log('❌ Функция вернула пустой результат.');
        }
    } catch (e) {
        console.error('💥 Ошибка выполнения:', e.message);
    }
}

runTest();
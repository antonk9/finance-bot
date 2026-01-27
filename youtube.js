import fetch from 'node-fetch';

export async function getLatestVideos(channelId, limit = 10) {
  const rss = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(rss);
  const text = await res.text();

  const videoIds = [...text.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>/g)]
    .map(m => m[1])
    .slice(0, limit);

  const titles = [...text.matchAll(/<title>(.*?)<\/title>/g)]
    .map(m => m[1])
    .slice(1, limit + 1); // первый title — это название канала

  return videoIds.map((id, i) => ({
    videoId: id,
    title: titles[i] || 'Untitled video'
  }));
}
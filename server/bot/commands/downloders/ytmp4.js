import axios from 'axios';

export default {
  name: "ytmp4",
  alias: ["video", "mp4", "ytv", "foxyvideo"],
  description: "Download video from YouTube",
  category: "downloaders",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };

    try {
      const q = args.join(' ');

      if (!q) {
        await sendMessage(
          `┌─⧭ VIDEO DOWNLOADER\n` +
          `│\n` +
          `│ Usage: ${PREFIX}ytmp4 <video name or URL>\n` +
          `│\n` +
          `│ Examples:\n` +
          `│  ${PREFIX}ytmp4 Believer\n` +
          `│  ${PREFIX}ytmp4 https://youtube.com/watch?v=...\n` +
          `│  ${PREFIX}ytmp4 https://youtube.com/shorts/...\n` +
          `│\n` +
          `│ Downloads as MP4 video\n` +
          `└─────────────────────`
        );
        return;
      }

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);

      if (isUrl) {
        await sendMessage(`Downloading video...`);

        const dlRes = await axios.get(`https://apis.xwolf.space/download/mp4?url=${encodeURIComponent(q)}`, {
          timeout: 60000
        });

        if (!dlRes.data?.success || !dlRes.data?.downloadUrl) {
          await sendMessage(
            `┌─⧭ ERROR\n` +
            `│\n` +
            `│ Failed to download video from the provided URL.\n` +
            `│ Make sure the URL is valid.\n` +
            `└─────────────────────`
          );
          return;
        }

        const title = dlRes.data.title || "YouTube Video";

        await sock.sendMessage(chatId, {
          video: { url: dlRes.data.downloadUrl },
          mimetype: "video/mp4",
          caption: title
        }, { quoted: m });

      } else {
        await sendMessage(`Searching for ${q}...`);

        const searchRes = await axios.get(`https://apis.xwolf.space/api/search?q=${encodeURIComponent(q)}`, {
          timeout: 15000
        });

        const items = searchRes.data?.items;

        if (!searchRes.data?.success || !Array.isArray(items) || items.length === 0) {
          await sendMessage(
            `┌─⧭ NO RESULTS\n` +
            `│\n` +
            `│ No results found for "${q}".\n` +
            `│ Try a different search term.\n` +
            `└─────────────────────`
          );
          return;
        }

        const video = items[0];
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const title = video.title || "Unknown Video";

        await sendMessage(`Downloading ${title}...`);

        const dlRes = await axios.get(`https://apis.xwolf.space/download/mp4?url=${encodeURIComponent(videoUrl)}`, {
          timeout: 60000
        });

        if (!dlRes.data?.success || !dlRes.data?.downloadUrl) {
          await sendMessage(
            `┌─⧭ DOWNLOAD FAILED\n` +
            `│\n` +
            `│ Could not download "${title}".\n` +
            `│ Try a different video.\n` +
            `└─────────────────────`
          );
          return;
        }

        await sock.sendMessage(chatId, {
          video: { url: dlRes.data.downloadUrl },
          mimetype: "video/mp4",
          caption: title
        }, { quoted: m });
      }

    } catch (error) {
      await sendMessage(
        `┌─⧭ ERROR\n` +
        `│\n` +
        `│ ${error.message}\n` +
        `└─────────────────────`
      );
    }
  }
};

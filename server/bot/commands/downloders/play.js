import axios from 'axios';

export default {
  name: "play",
  alias: ["song", "ytmp3", "yta", "foxyplay", "music"],
  description: "Download audio from YouTube",
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
          `┌─⧭ AUDIO DOWNLOADER\n` +
          `│\n` +
          `│ Usage: ${PREFIX}play <song name or URL>\n` +
          `│\n` +
          `│ Examples:\n` +
          `│  ${PREFIX}play Believer\n` +
          `│  ${PREFIX}play https://youtube.com/watch?v=...\n` +
          `│  ${PREFIX}play https://youtube.com/shorts/...\n` +
          `│\n` +
          `│ For document file: ${PREFIX}playdoc\n` +
          `└─────────────────────`
        );
        return;
      }

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);

      if (isUrl) {
        await sendMessage(`Downloading audio...`);

        const dlRes = await axios.get(`https://apis.xwolf.space/download/ytmp3?url=${encodeURIComponent(q)}`, {
          timeout: 30000
        });

        if (!dlRes.data?.success || !dlRes.data?.downloadUrl) {
          await sendMessage(
            `┌─⧭ ERROR\n` +
            `│\n` +
            `│ Failed to download audio from the provided URL.\n` +
            `│ Make sure the URL is valid.\n` +
            `└─────────────────────`
          );
          return;
        }

        const title = dlRes.data.title || "YouTube Audio";

        await sock.sendMessage(chatId, {
          audio: { url: dlRes.data.downloadUrl },
          mimetype: "audio/mpeg"
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
        const title = video.title || "Unknown Song";

        await sendMessage(`Downloading ${title}...`);

        const dlRes = await axios.get(`https://apis.xwolf.space/download/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
          timeout: 30000
        });

        if (!dlRes.data?.success || !dlRes.data?.downloadUrl) {
          await sendMessage(
            `┌─⧭ DOWNLOAD FAILED\n` +
            `│\n` +
            `│ Could not download "${title}".\n` +
            `│ Try a different song.\n` +
            `└─────────────────────`
          );
          return;
        }

        await sock.sendMessage(chatId, {
          audio: { url: dlRes.data.downloadUrl },
          mimetype: "audio/mpeg"
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

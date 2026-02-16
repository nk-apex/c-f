import axios from 'axios';

export default {
  name: "playdoc",
  alias: ["ytdoc", "audiodoc", "mp3doc"],
  description: "Download audio from YouTube as document file",
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
          `┌─⧭ AUDIO DOCUMENT DOWNLOADER\n` +
          `│\n` +
          `│ Usage: ${PREFIX}playdoc <song name or URL>\n` +
          `│\n` +
          `│ Examples:\n` +
          `│  ${PREFIX}playdoc Believer\n` +
          `│  ${PREFIX}playdoc https://youtube.com/watch?v=...\n` +
          `│  ${PREFIX}playdoc https://youtube.com/shorts/...\n` +
          `│\n` +
          `│ Downloads as MP3 document file\n` +
          `└─────────────────────`
        );
        return;
      }

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);

      if (isUrl) {
        await sendMessage(`Downloading audio document...`);

        const dlRes = await axios.get(`https://apis.xwolf.space/download/dlmp3?url=${encodeURIComponent(q)}`, {
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
        const fileName = `${title.substring(0, 50).replace(/[^\w\s.-]/gi, '')}.mp3`;

        await sock.sendMessage(chatId, {
          document: { url: dlRes.data.downloadUrl },
          mimetype: "audio/mpeg",
          fileName: fileName
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

        const dlRes = await axios.get(`https://apis.xwolf.space/download/dlmp3?url=${encodeURIComponent(videoUrl)}`, {
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

        const fileName = `${title.substring(0, 50).replace(/[^\w\s.-]/gi, '')}.mp3`;

        await sock.sendMessage(chatId, {
          document: { url: dlRes.data.downloadUrl },
          mimetype: "audio/mpeg",
          fileName: fileName
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

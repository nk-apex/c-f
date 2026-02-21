import axios from 'axios';

const API_BASE = 'https://apis.xwolf.space';

export default {
  name: "ytmp4",
  alias: ["ytv", "youtubemp4"],
  description: "Download YouTube video as MP4",
  category: "downloaders",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const react = async (emoji) => {
      try { await sock.sendMessage(chatId, { react: { text: emoji, key: m.key } }); } catch {}
    };

    try {
      const q = args.join(' ');
      if (!q) {
        await react("❓");
        await sock.sendMessage(chatId, {
          text: `┌─⧭ YTMP4\n│\n│ Usage: ${PREFIX}ytmp4 <video name or URL>\n│ Example: ${PREFIX}ytmp4 Believer\n│\n│ Downloads as MP4 video\n└─────────────────────`
        }, { quoted: m });
        return;
      }

      await react("🎬");

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);
      const params = isUrl ? `url=${encodeURIComponent(q)}` : `q=${encodeURIComponent(q)}`;
      const dlRes = await axios.get(`${API_BASE}/download/mp4?${params}`, { timeout: 60000 });
      const data = dlRes.data;

      const videoUrl = data?.downloadUrl || data?.streamUrl;
      if (!videoUrl) {
        await react("❌");
        return;
      }

      const title = data?.title || data?.searchResult?.title || "Video";

      await sock.sendMessage(chatId, {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption: title
      }, { quoted: m });

      await react("✅");
    } catch (error) {
      await react("❌");
    }
  }
};

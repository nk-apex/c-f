import axios from 'axios';

const API_BASE = 'https://apis.xwolf.space';

export default {
  name: "video",
  alias: ["foxyvideo", "vid"],
  description: "Download video from YouTube by name or URL",
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
          text: `┌─⧭ VIDEO\n│\n│ Usage: ${PREFIX}video <video name or URL>\n│ Example: ${PREFIX}video Believer\n│\n│ For document: ${PREFIX}videodoc\n└─────────────────────`
        }, { quoted: m });
        return;
      }

      await react("🎬");

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);
      const params = isUrl ? `url=${encodeURIComponent(q)}` : `q=${encodeURIComponent(q)}`;
      const dlRes = await axios.get(`${API_BASE}/download/mp4?${params}`, { timeout: 60000 });

      if (!dlRes.data?.success || !dlRes.data?.downloadUrl) {
        await react("❌");
        return;
      }

      const title = dlRes.data.title || "Video";

      await sock.sendMessage(chatId, {
        video: { url: dlRes.data.downloadUrl },
        mimetype: "video/mp4",
        caption: title
      }, { quoted: m });

      await react("✅");
    } catch (error) {
      await react("❌");
    }
  }
};

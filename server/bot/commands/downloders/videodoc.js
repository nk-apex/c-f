import axios from 'axios';

const API_BASE = 'https://apis.xwolf.space';

export default {
  name: "videodoc",
  alias: ["viddoc", "mp4doc"],
  description: "Download video as document file",
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
          text: `┌─⧭ VIDEODOC\n│\n│ Usage: ${PREFIX}videodoc <video name or URL>\n│ Example: ${PREFIX}videodoc Believer\n│\n│ Downloads as MP4 document file\n└─────────────────────`
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
      const fileName = `${title.substring(0, 50).replace(/[^\w\s.-]/gi, '')}.mp4`;

      await sock.sendMessage(chatId, {
        document: { url: videoUrl },
        mimetype: "video/mp4",
        fileName: fileName
      }, { quoted: m });

      await react("✅");
    } catch (error) {
      await react("❌");
    }
  }
};

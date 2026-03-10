import axios from 'axios';

const API_BASE = 'https://apis.xwolf.space';

export default {
  name: "playdoc",
  alias: ["audiodoc", "mp3doc"],
  description: "Download audio as document file",
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
          text: `┌─⧭ PLAYDOC\n├◆ Usage: ${PREFIX}playdoc <song name or URL>\n├◆ Example: ${PREFIX}playdoc Believer\n├◆ Downloads as MP3 document file\n└─────────────────────`
        }, { quoted: m });
        return;
      }

      await react("🎵");

      const isUrl = q.match(/(youtube\.com|youtu\.be)/i);
      const params = isUrl ? `url=${encodeURIComponent(q)}` : `q=${encodeURIComponent(q)}`;
      const dlRes = await axios.get(`${API_BASE}/download/ytmp3?${params}`, { timeout: 30000 });
      const data = dlRes.data;

      const audioUrl = data?.downloadUrl || data?.streamUrl;
      if (!audioUrl) {
        await react("❌");
        return;
      }

      const title = data?.title || data?.searchResult?.title || "Audio";
      const fileName = `${title.substring(0, 50).replace(/[^\w\s.-]/gi, '')}.mp3`;

      await sock.sendMessage(chatId, {
        document: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: fileName
      }, { quoted: m });

      await react("✅");
    } catch (error) {
      await react("❌");
    }
  }
};

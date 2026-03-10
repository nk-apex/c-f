import axios from 'axios';

const API_BASE = 'https://apis.xwolf.space';

export default {
  name: "mp3",
  alias: ["dlmp3", "directmp3"],
  description: "Direct MP3 download by name or URL",
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
          text: `┌─⧭ MP3\n│\n├◆ Usage: ${PREFIX}mp3 <song name or URL>\n├◆ Example: ${PREFIX}mp3 Blinding Lights\n└─────────────────────`
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

      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg"
      }, { quoted: m });

      await react("✅");
    } catch (error) {
      await react("❌");
    }
  }
};

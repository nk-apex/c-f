import axios from 'axios';

export default {
  name: "aisong",
  alias: ["songai", "generatesong", "aimusic2"],
  description: "Generate songs with AI",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const prompt = args.join(' ');
    
    if (!prompt) {
      await sock.sendMessage(chatId, {
        text: `🎶 *AI Song Generator*\n\nCreate custom songs\n\nUsage: ${PREFIX}aisong <description>\n\nExample: ${PREFIX}aisong A happy pop song about summer love`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "🎶", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/song?prompt=${encodeURIComponent(prompt)}`);
      const songUrl = response.data?.url || response.data?.result;
      
      if (songUrl) {
        await sock.sendMessage(chatId, {
          audio: { url: songUrl },
          mimetype: 'audio/mpeg',
          fileName: `ai_song_${Date.now()}.mp3`,
          caption: `🎵 AI Song: "${prompt}"`
        }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, { text: "❌ No song generated" }, { quoted: m });
      }
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ Song generation failed" }, { quoted: m });
    }
  }
};
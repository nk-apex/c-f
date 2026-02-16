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
        text: `\u250C\u2500\u29ED *AI Song Generator*\n` +
              `\u2502 Create custom songs with AI\n` +
              `\u2502\n` +
              `\u2502 Usage: ${PREFIX}aisong <description>\n` +
              `\u2502 Example: ${PREFIX}aisong A happy pop\n` +
              `\u2502 song about summer love\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "\u266C", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/song?prompt=${encodeURIComponent(prompt)}`);
      const songUrl = response.data?.url || response.data?.result;
      
      if (songUrl) {
        await sock.sendMessage(chatId, {
          audio: { url: songUrl },
          mimetype: 'audio/mpeg',
          fileName: `ai_song_${Date.now()}.mp3`,
          caption: `\u250C\u2500\u29ED *AI Song*\n\u2502 "${prompt}"\n\u2514\u2500\u29ED`
        }, { quoted: m });
      } else {
        await sock.sendMessage(chatId, {
          text: `\u250C\u2500\u29ED *Error*\n\u2502 No song generated\n\u2514\u2500\u29ED`
        }, { quoted: m });
      }
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u2502 Song generation failed\n\u2502 Try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
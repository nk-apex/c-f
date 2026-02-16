import axios from 'axios';

export default {
  name: "metaai",
  alias: ["meta", "facebookai"],
  description: "Chat with Meta AI",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const question = args.join(' ');
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `🤖 *Meta AI*\n\nUsage: ${PREFIX}metaai <question>`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "🔷", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/metai?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, { text: answer }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ Meta AI unavailable" }, { quoted: m });
    }
  }
};
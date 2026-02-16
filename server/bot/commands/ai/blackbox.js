import axios from 'axios';

export default {
  name: "blackbox",
  alias: ["bb", "blackboxai"],
  description: "Chat with Blackbox AI",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const question = args.join(' ');
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `⬛ *Blackbox AI*\n\nUsage: ${PREFIX}blackbox <question>`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "⬛", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/blackbox?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, { text: answer }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ Blackbox AI unavailable" }, { quoted: m });
    }
  }
};
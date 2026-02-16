import axios from 'axios';

export default {
  name: "llama",
  alias: ["llamaai", "metaai2"],
  description: "Chat with Llama AI",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const question = args.join(' ');
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `🦙 *Llama AI*\n\nUsage: ${PREFIX}llama <question>`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "🦙", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/ilama?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, { text: answer }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ Llama AI unavailable" }, { quoted: m });
    }
  }
};
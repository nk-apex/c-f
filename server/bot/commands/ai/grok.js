import axios from 'axios';

export default {
  name: "grok",
  alias: ["xai", "grokai"],
  description: "Chat with Grok AI (xAI)",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const question = args.join(' ');
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `🤖 *Grok AI*\n\nUsage: ${PREFIX}grok <question>`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "🤪", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/grok?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, { text: answer }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ Grok AI unavailable" }, { quoted: m });
    }
  }
};
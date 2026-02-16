import axios from 'axios';

export default {
  name: "deepseek",
  alias: ["ds", "deepseekv3"],
  description: "Chat with DeepSeek V3 AI",
  category: "AI",
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const question = args.join(' ');
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `🤖 *DeepSeek V3*\n\nUsage: ${PREFIX}deepseek <question>`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, { react: { text: "🌀", key: m.key } });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/deepseekV3?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, { text: answer }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, { text: "❌ DeepSeek unavailable" }, { quoted: m });
    }
  }
};
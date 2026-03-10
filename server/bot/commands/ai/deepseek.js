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
        text: `\u250C\u2500\u29ED *DeepSeek V3*\n` +
              `\u251C\u25C6 Usage: ${PREFIX}deepseek <question>\n` +
              `\u251C\u25C6 Example: ${PREFIX}deepseek what is\n` +
              `\u251C\u25C6 quantum computing?\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Processing...*\n\u251C\u25C6 Asking DeepSeek...\n\u2514\u2500\u29ED`
    }, { quoted: m });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/deepseekV3?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *DeepSeek V3*\n\u251C\u25C6 ${answer.split('\n').join('\n\u251C\u25C6 ')}\n\u2514\u2500\u29ED`
      }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 DeepSeek unavailable\n\u251C\u25C6 Try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
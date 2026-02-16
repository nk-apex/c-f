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
              `\u2502 Usage: ${PREFIX}deepseek <question>\n` +
              `\u2502 Example: ${PREFIX}deepseek what is\n` +
              `\u2502 quantum computing?\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Asking DeepSeek...\n\u2514\u2500\u29ED`
    }, { quoted: m });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/deepseekV3?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *DeepSeek V3*\n\u2502 ${answer.split('\n').join('\n\u2502 ')}\n\u2514\u2500\u29ED`
      }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u2502 DeepSeek unavailable\n\u2502 Try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
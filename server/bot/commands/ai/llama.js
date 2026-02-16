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
        text: `\u250C\u2500\u29ED *Llama AI*\n` +
              `\u2502 Usage: ${PREFIX}llama <question>\n` +
              `\u2502 Example: ${PREFIX}llama what is\n` +
              `\u2502 machine learning?\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Asking Llama AI...\n\u2514\u2500\u29ED`
    }, { quoted: m });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/ilama?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Llama AI*\n\u2502 ${answer.split('\n').join('\n\u2502 ')}\n\u2514\u2500\u29ED`
      }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u2502 Llama AI unavailable\n\u2502 Try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
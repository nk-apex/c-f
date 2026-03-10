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
        text: `\u250C\u2500\u29ED *Meta AI*\n` +
              `\u251C\u25C6 Usage: ${PREFIX}metaai <question>\n` +
              `\u251C\u25C6 Example: ${PREFIX}metaai explain\n` +
              `\u251C\u25C6 neural networks\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Processing...*\n\u251C\u25C6 Asking Meta AI...\n\u2514\u2500\u29ED`
    }, { quoted: m });
    
    try {
      const response = await axios.get(`https://apiskeith.vercel.app/ai/metai?q=${encodeURIComponent(question)}`);
      const answer = response.data?.result || response.data?.response || "No response";
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Meta AI*\n\u251C\u25C6 ${answer.split('\n').join('\n\u251C\u25C6 ')}\n\u2514\u2500\u29ED`
      }, { quoted: m });
    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Meta AI unavailable\n\u251C\u25C6 Try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
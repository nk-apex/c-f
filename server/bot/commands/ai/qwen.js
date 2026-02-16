import axios from 'axios';

export default {
  name: "qwenai",
  alias: ["qwen", "alibabaai", "alibaba"],
  description: "Qwen AI from Alibaba",
  category: "AI",
  usage: ".qwenai <your question>",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      const q = args.join(' ').trim();
      
      if (!q) {
        return sendMessage(
          `\u250C\u2500\u29ED *Qwen AI (Alibaba)*\n` +
          `\u2502 Alibaba's large language model\n` +
          `\u2502\n` +
          `\u2502 Usage:\n` +
          `\u2502 ${PREFIX}qwenai <your question>\n` +
          `\u2502\n` +
          `\u2502 Examples:\n` +
          `\u2502 ${PREFIX}qwenai What is AI?\n` +
          `\u2502 ${PREFIX}qwenai Write a poem\n` +
          `\u2502 about nature\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Processing...*\n\u2502 Asking Qwen AI...\n\u2514\u2500\u29ED`);
      
      const encodedQuery = encodeURIComponent(q);
      const apiUrl = `https://apiskeith.vercel.app/ai/qwenai?q=${encodedQuery}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      let answer = response.data?.result || response.data?.response || response.data || "No response";
      
      if (typeof answer === 'string') {
        answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        answer = answer.replace(/<[^>]*>/g, '').trim();
        
        if (!answer || answer.length < 2) {
          answer = response.data?.result || response.data?.response || "I received your message but the response was empty.";
        }
      }
      
      if (typeof answer === 'object') {
        try {
          answer = JSON.stringify(answer, null, 2);
        } catch {
          answer = "Received object response. Try a different question.";
        }
      }
      
      const maxLength = 4000;
      if (answer.length > maxLength) {
        answer = answer.substring(0, maxLength - 100) + 
                `\n\n... (truncated, ${answer.length - maxLength + 100} more characters)`;
      }
      
      await sendMessage(
        `\u250C\u2500\u29ED *Qwen AI*\n` +
        `\u2502\n` +
        `\u2502 Question: ${q}\n` +
        `\u2502\n` +
        `\u2502 Answer:\n` +
        `\u2502 ${answer.split('\n').join('\n\u2502 ')}\n` +
        `\u2514\u2500\u29ED`
      );
      
    } catch (error) {
      console.error('Qwen AI error:', error);
      
      let errorDetail = "Qwen AI is currently unavailable.";
      
      if (error.message?.includes('timeout')) {
        errorDetail = "Request timeout. Try a shorter question.";
      } else if (error.message?.includes('Network Error')) {
        errorDetail = "Network error. Check connection.";
      } else if (error.response?.status === 429) {
        errorDetail = "Rate limited. Please wait a minute.";
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Error*\n\u2502 ${errorDetail}\n\u2502 Try again later\n\u2514\u2500\u29ED`);
    }
  }
};
import axios from 'axios';

const gptSessions = new Map();

async function getGPTResponse(question) {
  try {
    const response = await axios.get(`https://apiskeith.vercel.app/ai/gpt?q=${encodeURIComponent(question)}`, {
      timeout: 10000
    });
    
    let answer = response.data?.result || response.data?.response || response.data;
    
    if (typeof answer !== 'string') {
      answer = JSON.stringify(answer);
    }
    
    return answer.trim() || "I'm here to help!";
    
  } catch (error) {
    console.error('GPT API Error:', error.message);
    return "Sorry, I couldn't process that right now. Please try again!";
  }
}

export default {
  name: 'gpt',
  alias: ['chatgpt', 'openai', 'ask'],
  description: 'Chat with GPT AI',
  category: 'AI',
  usage: '.gpt <your question>',
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    
    const question = args.join(' ').trim();
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *GPT AI*\n` +
              `\u2502 Ask me anything!\n` +
              `\u2502\n` +
              `\u2502 Example:\n` +
              `\u2502 ${PREFIX}gpt What is artificial\n` +
              `\u2502 intelligence?\n` +
              `\u2502 ${PREFIX}gpt Write a poem about coding\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
      return;
    }
    
    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Asking GPT...\n\u2514\u2500\u29ED`
    }, { quoted: m });
    
    try {
      const answer = await getGPTResponse(question);
      
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *GPT AI*\n\u2502 ${answer.split('\n').join('\n\u2502 ')}\n\u2514\u2500\u29ED`
      }, { quoted: m });
      
    } catch (error) {
      console.error('GPT command error:', error);
      
      await sock.sendMessage(chatId, {
        text: `\u250C\u2500\u29ED *Error*\n\u2502 Failed to get response\n\u2502 Please try again later\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
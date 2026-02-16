import axios from 'axios';

// Simple conversation storage for GPT
const gptSessions = new Map();

// Get GPT response
async function getGPTResponse(question) {
  try {
    // Call the GPT API
    const response = await axios.get(`https://apiskeith.vercel.app/ai/gpt?q=${encodeURIComponent(question)}`, {
      timeout: 10000
    });
    
    // Extract response
    let answer = response.data?.result || response.data?.response || response.data;
    
    // Clean up response
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
    
    // Get the question
    const question = args.join(' ').trim();
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `🤖 *GPT AI*\n\nAsk me anything!\n\n*Example:*\n${PREFIX}gpt What is artificial intelligence?\n${PREFIX}gpt Explain quantum computing\n${PREFIX}gpt Write a poem about coding`
      }, { quoted: m });
      return;
    }
    
    // Show thinking
    await sock.sendMessage(chatId, {
      react: { text: "🤔", key: m.key }
    });
    
    try {
      // Get GPT response
      const answer = await getGPTResponse(question);
      
      // Send response
      await sock.sendMessage(chatId, {
        react: { text: "🤖", key: m.key }
      });
      
      await sock.sendMessage(chatId, {
        text: answer
      }, { quoted: m });
      
    } catch (error) {
      console.error('GPT command error:', error);
      
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: m.key }
      });
      
      await sock.sendMessage(chatId, {
        text: '❌ Failed to get response. Please try again later.'
      }, { quoted: m });
    }
  }
};
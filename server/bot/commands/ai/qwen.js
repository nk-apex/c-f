// File: commands/ai/qwenai.js
import axios from 'axios';

export default {
  name: "qwenai",
  alias: ["qwen", "alibabaai", "alibaba"],
  description: "Qwen AI from Alibaba",
  category: "AI",
  usage: ".qwenai <your question>",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    const sendReaction = async (emoji) => {
      try {
        await sock.sendMessage(chatId, {
          react: { text: emoji, key: m.key }
        });
      } catch (err) {
        console.log('Reaction failed:', err.message);
      }
    };
    
    try {
      const q = args.join(' ').trim();
      
      if (!q) {
        return sendMessage(
          `🤖 *Qwen AI (Alibaba)*\n\n` +
          `Qwen is Alibaba's large language model\n\n` +
          `📝 *Usage:*\n` +
          `▸ ${PREFIX}qwenai <your question>\n\n` +
          `🔍 *Examples:*\n` +
          `▸ ${PREFIX}qwenai What is artificial intelligence?\n` +
          `▸ ${PREFIX}qwenai Explain quantum computing\n` +
          `▸ ${PREFIX}qwenai Write a poem about nature\n\n` +
          `💡 *Powered by:* Alibaba Qwen LLM`
        );
      }
      
      // Start processing
      await sendReaction("🤖");
      
      // Send API request to Qwen endpoint
      const encodedQuery = encodeURIComponent(q);
      const apiUrl = `https://apiskeith.vercel.app/ai/qwenai?q=${encodedQuery}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      // Process the response - remove <think> tags and extract clean response
      let answer = response.data?.result || response.data?.response || response.data || "No response";
      
      // Clean the response by removing thinking tags
      if (typeof answer === 'string') {
        // Remove <think>...</think> tags and content between them
        answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        
        // Remove other XML/HTML tags if present
        answer = answer.replace(/<[^>]*>/g, '').trim();
        
        // If answer is empty after cleaning, use default
        if (!answer || answer.length < 2) {
          answer = response.data?.result || response.data?.response || "I received your message but the response was empty.";
        }
      }
      
      // If answer is an object, try to stringify it
      if (typeof answer === 'object') {
        try {
          answer = JSON.stringify(answer, null, 2);
        } catch {
          answer = "Received object response. Try a different question.";
        }
      }
      
      // Truncate if too long for WhatsApp
      const maxLength = 4000; // WhatsApp message limit
      if (answer.length > maxLength) {
        answer = answer.substring(0, maxLength - 100) + 
                `\n\n... (truncated, ${answer.length - maxLength + 100} more characters)\n` +
                `💡 *Tip:* Ask shorter questions for full responses.`;
      }
      
      // Send the response
      await sendMessage(
        `🤖 *Qwen AI Response*\n\n` +
        `❓ *Question:* ${q}\n\n` +
        `💡 *Answer:*\n${answer}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*Powered by Alibaba Qwen*`
      );
      
      await sendReaction("✅");
      
    } catch (error) {
      console.error('Qwen AI error:', error);
      await sendReaction("❌");
      
      let errorMsg = "❌ Qwen AI is currently unavailable.";
      
      if (error.message?.includes('timeout')) {
        errorMsg = "❌ Request timeout. Try again with a shorter question.";
      } else if (error.message?.includes('Network Error')) {
        errorMsg = "❌ Network error. Check your connection.";
      } else if (error.response?.status === 404) {
        errorMsg = "❌ Qwen AI endpoint not found.";
      } else if (error.response?.status === 429) {
        errorMsg = "❌ Rate limited. Please wait a minute.";
      }
      
      await sendMessage(
        `${errorMsg}\n\n` +
        `💡 *Try:*\n` +
        `• Different question\n` +
        `• Shorter query\n` +
        `• Try again in a minute`
      );
    }
  }
};
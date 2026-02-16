import axios from 'axios';

// Simple conversation storage
const foxyAI = {
  conversations: new Map(),
  
  addConversation(chatId, userId, question, answer) {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, []);
    }
    
    const chatHistory = this.conversations.get(chatId);
    chatHistory.push({
      user: userId,
      question,
      answer,
      timestamp: Date.now()
    });
    
    // Keep only last 10 messages
    if (chatHistory.length > 10) {
      chatHistory.shift();
    }
  },
  
  getContext(chatId) {
    const chatHistory = this.conversations.get(chatId) || [];
    if (chatHistory.length === 0) return '';
    
    let context = '';
    chatHistory.forEach(msg => {
      context += `User: ${msg.question}\n`;
      context += `Foxy: ${msg.answer}\n\n`;
    });
    
    return context;
  },
  
  clearHistory(chatId) {
    if (this.conversations.has(chatId)) {
      this.conversations.delete(chatId);
      return true;
    }
    return false;
  }
};

// Get AI response from API
async function getAIResponse(question, context = '') {
  try {
    // Create the prompt with Foxy's personality
    let prompt = `You are "Foxy", a WhatsApp bot assistant. `;
    prompt += `You are friendly, helpful, and concise. You answer questions directly. `;
    prompt += `You can use emojis occasionally but don't overdo it.\n\n`;
    
    if (context) {
      prompt += `Previous conversation:\n${context}\n\n`;
    }
    
    prompt += `User's message: ${question}\n\n`;
    prompt += `Foxy's response:`;
    
    // Call the API
    const response = await axios.get(`https://apiskeith.vercel.app/ai/gpt?q=${encodeURIComponent(prompt)}`, {
      timeout: 10000
    });
    
    // Extract response
    let answer = response.data?.result || response.data?.response || response.data || "Hey there!";
    
    // Clean up response
    if (typeof answer !== 'string') {
      answer = JSON.stringify(answer);
    }
    
    // Remove any prefix if the AI added it
    answer = answer.replace(/^(Foxy:|Assistant:|AI:|Bot:)\s*/i, '').trim();
    
    return answer || "Hey! What can I help you with? 🦊";
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Fallback responses
    const q = question.toLowerCase();
    
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "Hey! I'm Foxy, your WhatsApp bot! How can I help you? 🦊";
    }
    if (q.includes('name')) {
      return "I'm Foxy! Nice to meet you! 😊";
    }
    if (q.includes('what can you do')) {
      return "I can chat with you, answer questions, and help with tasks! Just ask me anything!";
    }
    if (q.includes('who made you') || q.includes('creator')) {
      return "I'm Foxy, a WhatsApp bot! That's all you need to know! 🦊";
    }
    if (q.includes('thank')) {
      return "You're welcome! 😄";
    }
    
    return "I'm Foxy! I'm here to help. Could you rephrase that?";
  }
}

export default {
  name: 'foxy',
  alias: ['ai', 'chat', 'bot'],
  description: 'Chat with Foxy AI',
  category: 'AI',
  usage: '.foxy <message>\n.foxy clear',
  
  async execute(sock, m, args, PREFIX) {
    const chatId = m.key.remoteJid;
    const sender = m.key.participant || chatId;
    const userId = sender.split('@')[0];
    
    // Clear command
    if (args[0]?.toLowerCase() === 'clear') {
      const cleared = foxyAI.clearHistory(chatId);
      
      await sock.sendMessage(chatId, {
        react: { text: "🧹", key: m.key }
      });
      
      await sock.sendMessage(chatId, {
        text: cleared 
          ? '✅ Conversation cleared!'
          : 'ℹ️ No conversation to clear.'
      }, { quoted: m });
      return;
    }
    
    // AI chat
    const question = args.join(' ').trim();
    
    if (!question) {
      await sock.sendMessage(chatId, {
        text: `Ask me anything!\nExample: ${PREFIX}foxy Hello`
      }, { quoted: m });
      return;
    }
    
    // Show thinking
    await sock.sendMessage(chatId, {
      react: { text: "🤔", key: m.key }
    });
    
    try {
      // Get context
      const context = foxyAI.getContext(chatId);
      
      // Get AI response
      const answer = await getAIResponse(question, context);
      
      // Store conversation
      foxyAI.addConversation(chatId, userId, question, answer);
      
      // Send response
      await sock.sendMessage(chatId, {
        react: { text: "🤖", key: m.key }
      });
      
      await sock.sendMessage(chatId, {
        text: answer
      }, { quoted: m });
      
    } catch (error) {
      console.error('Foxy error:', error);
      
      await sock.sendMessage(chatId, {
        react: { text: "❌", key: m.key }
      });
      
      await sock.sendMessage(chatId, {
        text: 'Sorry, something went wrong. Try again!'
      }, { quoted: m });
    }
  }
};
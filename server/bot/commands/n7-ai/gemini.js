import axios from "axios";

export default {
  name: "gemini",
  category: "AI",
  aliases: ["googleai", "googlegemini", "gem"],
  description: "Chat with Google Gemini AI via XWolf API",
  
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    const quoted = m.quoted;
    let query = "";

    if (args.length > 0) {
      query = args.join(" ");
    } else if (quoted && quoted.text) {
      query = quoted.text;
    } else {
      await sock.sendMessage(jid, { 
        text: `┌─⧭ ✨ *GOOGLE GEMINI AI* \n├◆ *${PREFIX}gemini <question>*\n├◆  └⊷ Ask Gemini anything\n├◆ *${PREFIX}googleai <question>*\n├◆  └⊷ Alias for gemini\n├◆ *${PREFIX}gem <question>*\n├◆  └⊷ Alias for gemini\n└─⧭`
      }, { quoted: m });
      return;
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const response = await axios({
        method: 'POST',
        url: 'https://apis.xwolf.space/api/ai/gemini',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        data: {
          prompt: query
        }
      });

      let geminiResponse = '';
      
      if (response.data && typeof response.data === 'object') {
        const data = response.data;
        
        if (data.success && data.response) {
          geminiResponse = data.response;
        } else if (data.result) {
          geminiResponse = data.result;
        } else if (data.response) {
          geminiResponse = data.response;
        } else if (data.answer) {
          geminiResponse = data.answer;
        } else if (data.text) {
          geminiResponse = data.text;
        } else if (data.content) {
          geminiResponse = data.content;
        } else if (data.message && !data.error) {
          geminiResponse = data.message;
        } else if (data.data && typeof data.data === 'string') {
          geminiResponse = data.data;
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          const values = Object.values(data).filter(v => typeof v === 'string' && v.length > 10);
          if (values.length > 0) {
            geminiResponse = values[0];
          } else {
            throw new Error('Could not extract response from API');
          }
        }
      } else if (typeof response.data === 'string') {
        geminiResponse = response.data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      if (!geminiResponse || geminiResponse.trim() === '') {
        throw new Error('Gemini returned empty response');
      }
      
      geminiResponse = geminiResponse.trim();
      geminiResponse = geminiResponse.replace(/\*\*(.*?)\*\*/g, '*$1*');
      geminiResponse = geminiResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      if (geminiResponse.length > 2500) {
        geminiResponse = geminiResponse.substring(0, 2500) + '\n\n... _(response truncated)_';
      }

      const displayQuery = query.length > 80 ? query.substring(0, 80) + '...' : query;
      
      let resultText = `✨ *GOOGLE GEMINI*\n\n`;
      resultText += `💭 *Query:* ${displayQuery}\n\n`;
      resultText += `🤖 *Gemini's Response:*\n${geminiResponse}\n\n`;
      
      const model = response.data?.model || 'Gemini';
      resultText += `⚡ *Powered by ${model}*`;

      await sock.sendMessage(jid, { text: resultText }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (error) {
      let errorMessage = `❌ *GEMINI AI ERROR*\n\n`;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorMessage += `• Gemini API server unreachable\n`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage += `• Request timed out\n`;
      } else if (error.response?.status === 429) {
        errorMessage += `• Rate limit exceeded, wait a moment\n`;
      } else if (error.response?.status >= 500) {
        errorMessage += `• Server error, try again later\n`;
      } else if (error.message) {
        errorMessage += `• ${error.message}\n`;
      }
      
      errorMessage += `\n🔧 *Try:*\n`;
      errorMessage += `1. Rephrase your question\n`;
      errorMessage += `2. Wait a moment and retry\n`;
      errorMessage += `3. Use other AI: \`${PREFIX}gpt\`, \`${PREFIX}bard\`, \`${PREFIX}copilot\``;
      
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: errorMessage
      }, { quoted: m });
    }
  }
};

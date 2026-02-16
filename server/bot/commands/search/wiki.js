import fetch from "node-fetch";

export default {
  name: "wiki",
  alias: ["wikipedia", "foxywiki"], // Added foxywiki alias
  category: "tools",
  desc: "Search Wikipedia and get a brief summary",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      // Determine the search term
      let searchTerm = args.join(" ").trim();

      // Check if it's a reply
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!searchTerm && quoted) {
        searchTerm =
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          quoted.videoMessage?.caption ||
          "";
      }

      if (!searchTerm) {
        return await sendMessage(
          `🦊 *FoxyBot Wikipedia Search*\n\n` +
          `*Usage:*\n` +
          `• \`${PREFIX}wiki <search term>\`\n` +
          `• Reply to a message with \`${PREFIX}wiki\`\n\n` +
          `*Examples:*\n` +
          `• \`${PREFIX}wiki Albert Einstein\`\n` +
          `• \`${PREFIX}wiki Artificial Intelligence\``
        );
      }

      // Send processing message
      const processingMsg = await sendMessage(`🔍 *Searching Wikipedia for:*\n"${searchTerm}"\n\n⏳ Please wait...`);

      // Special default for "Foxy Bot" or "FoxyBot"
      if (searchTerm.toLowerCase().includes("foxy") || searchTerm.toLowerCase().includes("fox")) {
        return await sock.sendMessage(chatId, { 
          text: `🦊 *FoxyBot* — The Clever Fox of WhatsApp Bots!\n\n` +
          `🌟 Known for lightning-fast responses and witty banter\n` +
          `📚 Can fetch knowledge from all corners of the web\n` +
          `🎭 Master of stickers, downloads, and entertainment\n\n` +
          `🐾 *Foxy Facts:*\n` +
          `• Always one step ahead\n` +
          `• Loves to play with data\n` +
          `• Has a den full of useful commands\n` +
          `• Never sleeps on the hunt for information!`,
          edit: processingMsg.key 
        }, { quoted: m });
      }

      // Fetch from Wikipedia API
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`, {
        timeout: 10000
      });
      
      if (!response.ok) {
        await sock.sendMessage(chatId, { 
          text: `❌ *No Wikipedia article found for:*\n"${searchTerm}"\n\n` +
          `💡 *Suggestions:*\n` +
          `• Check spelling\n` +
          `• Try different keywords\n` +
          `• Search for broader topic`,
          edit: processingMsg.key 
        });
        return;
      }

      const data = await response.json();

      const resultMessage = 
        `🦊 *Wikipedia Search Result*\n\n` +
        `📌 *Title:* ${data.title}\n` +
        `📝 *Description:* ${data.description || "No description available"}\n\n` +
        `📄 *Summary:*\n${data.extract || "No summary available"}\n\n` +
        `🔗 *Read More:*\n${data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`}`;

      await sock.sendMessage(chatId, { 
        text: resultMessage, 
        edit: processingMsg.key,
        linkPreview: true 
      });

      // Log the search
      const senderJid = m.key.participant || chatId;
      const cleaned = jidManager.cleanJid(senderJid);
      console.log(`🔍 Wikipedia search by: ${cleaned.cleanNumber || 'Unknown'} - "${searchTerm}"`);
      
    } catch (error) {
      console.error('Wikipedia command error:', error);
      
      let errorMsg = "❌ *Wikipedia Search Failed*\n\n";
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        errorMsg += "⏱ Request timed out\n";
        errorMsg += "Wikipedia might be slow or your query is too complex.\n";
      } else if (error.message.includes('fetch')) {
        errorMsg += "🌐 Network error\n";
        errorMsg += "Check your internet connection.\n";
      } else {
        errorMsg += `Error: ${error.message}\n`;
      }
      
      errorMsg += "\n💡 *Try:*\n";
      errorMsg += "• Simpler search terms\n";
      errorMsg += "• Try again in a minute\n";
      errorMsg += "• Check your connection";
      
      await sendMessage(errorMsg);
    }
  }
};
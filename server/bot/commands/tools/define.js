import axios from 'axios';

export default {
  name: "dictionary",
  alias: ["dict", "define", "meaning", "word"],
  description: "Look up definitions, pronunciations, and more for any English word",
  category: "Education",
  usage: ".dictionary <word>\nExample: .dictionary cat\nExample: .dictionary hello",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    // Simple start reaction
    await sock.sendMessage(chatId, {
      react: { text: "📚", key: m.key }
    });
    
    try {
      const query = args.join(' ').trim();
      
      if (!query) {
        await sock.sendMessage(chatId, {
          react: { text: "❓", key: m.key }
        });
        
        setTimeout(async () => {
          await sendMessage(
            `📖 *Dictionary Lookup*\n\n` +
            `*Usage:* ${PREFIX}dictionary <word>\n\n` +
            `*Examples:*\n` +
            `• ${PREFIX}dictionary cat\n` +
            `• ${PREFIX}dictionary beautiful\n` +
            `• ${PREFIX}dictionary entrepreneur\n\n` +
            `Get definitions, pronunciations, synonyms and more!`
          );
        }, 300);
        return;
      }
      
      // Searching reaction
      await sock.sendMessage(chatId, {
        react: { text: "🔍", key: m.key }
      });
      
      try {
        // Call the dictionary API
        const response = await axios.get(`https://apiskeith.vercel.app/education/dictionary?q=${encodeURIComponent(query)}`, {
          timeout: 10000
        });
        
        const data = response.data;
        
        if (!data.status || !data.result) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage(`❌ Word "${query}" not found in the dictionary.\nTry a different word or check the spelling.`);
          return;
        }
        
        const result = data.result;
        
        // Success reaction
        await sock.sendMessage(chatId, {
          react: { text: "✅", key: m.key }
        });
        
        // Build the response message
        let message = `📖 *Dictionary: ${result.word}*\n\n`;
        
        // Add phonetics if available
        if (result.phonetics && result.phonetics.length > 0) {
          message += `*Pronunciation:*\n`;
          result.phonetics.forEach((ph, index) => {
            if (ph.text) {
              const type = ph.audio && ph.audio.includes('uk.mp3') ? '🇬🇧 UK' : '🇺🇸 US';
              message += `• ${type}: ${ph.text}\n`;
            }
          });
          message += `\n`;
        }
        
        // Add meanings
        if (result.meanings && result.meanings.length > 0) {
          result.meanings.forEach((meaning, index) => {
            message += `*${meaning.partOfSpeech.toUpperCase()}*\n`;
            
            // Show first 3 definitions
            const defs = meaning.definitions.slice(0, 3);
            defs.forEach((def, defIndex) => {
              message += `${defIndex + 1}. ${def.definition}\n`;
            });
            
            // Add synonyms if available
            if (meaning.synonyms && meaning.synonyms.length > 0) {
              const shortSynonyms = meaning.synonyms.slice(0, 5);
              message += `  *Synonyms:* ${shortSynonyms.join(', ')}`;
              if (meaning.synonyms.length > 5) message += ` (+${meaning.synonyms.length - 5} more)`;
              message += `\n`;
            }
            
            message += `\n`;
          });
        }
        
        // Add source info
        if (result.sourceUrls && result.sourceUrls.length > 0) {
          message += `*Source:* ${result.sourceUrls[0]}\n`;
        }
        
        message += `\n*Tip:* Use ${PREFIX}dictionary <word> to look up any English word!`;
        
        // Send the dictionary result
        await sendMessage(message);
        
        // Optional: Send audio pronunciation if available
        if (result.phonetics && result.phonetics.length > 0) {
          const audio = result.phonetics.find(p => p.audio)?.audio;
          if (audio) {
            setTimeout(async () => {
              try {
                await sock.sendMessage(chatId, {
                  audio: { url: audio },
                  mimetype: 'audio/mpeg',
                  fileName: `pronunciation_${result.word}.mp3`
                }, { quoted: m });
              } catch (audioError) {
                // Silent fail for audio
              }
            }, 500);
          }
        }
        
        // Log usage
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`📖 Dictionary lookup by: ${cleaned.cleanNumber || 'Anonymous'} - "${result.word}"`);
        
      } catch (apiError) {
        console.error('API error:', apiError);
        
        await sock.sendMessage(chatId, {
          react: { text: "❌", key: m.key }
        });
        
        if (apiError.response?.status === 404) {
          await sendMessage(`❌ Word "${query}" not found.\nThe word might not exist in the dictionary or there's a spelling error.`);
        } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT') {
          await sendMessage(`❌ Dictionary service is currently unavailable.\nPlease try again in a few moments.`);
        } else {
          await sendMessage(`❌ Failed to look up word.\nError: ${apiError.message}`);
        }
      }
      
    } catch (error) {
      console.error('Command error:', error);
      
      await sock.sendMessage(chatId, {
        react: { text: "💥", key: m.key }
      });
      
      await sendMessage(`❌ An unexpected error occurred.\nPlease try again later.`);
    }
  }
};
import axios from 'axios';

export default {
  name: "play",
  alias: ["ytmp3", "yta", "foxyplay", "fireaudio"],
  description: "Download audio from YouTube",
  category: "Downloader",
  usage: ".play <song name or youtube url>\nExample: .play Believer\nExample: .play https://youtube.com/shorts/...",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    await sock.sendMessage(chatId, {
      react: { text: "🎵", key: m.key }
    });
    
    try {
      const q = args.join(' ');
      
      if (!q) {
        await sendMessage(
          `🎧 *AUDIO DOWNLOADER* 🦊\n\n` +
          `*Usage:* ${PREFIX}play <song>\n\n` +
          `*Examples:*\n` +
          `• ${PREFIX}play Believer\n` +
          `• ${PREFIX}play https://youtube.com/watch?v=...\n` +
          `• ${PREFIX}play https://youtube.com/shorts/...\n\n` +
          `*For document file:* ${PREFIX}playdoc`
        );
        return;
      }
      
      await sock.sendMessage(chatId, {
        react: { text: "🔍", key: m.key }
      });
      
      let videoUrl;
      let videoTitle;

      // Check if input is a YouTube URL
      if (q.match(/(youtube\.com|youtu\.be)/i)) {
        videoUrl = q;
        videoTitle = "YouTube Audio";
        
        // Validate it's a proper YouTube URL
        const urlPatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^"&?\/\s]{11})/i,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/i,
            /youtube\.com\/live\/([^"&?\/\s]{11})/i
        ];
        
        let isValid = false;
        for (const pattern of urlPatterns) {
            if (q.match(pattern)) {
                isValid = true;
                break;
            }
        }
        
        if (!isValid) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage(
            `❌ *Invalid YouTube URL* 🦊\n\n` +
            `*Supported formats:*\n` +
            `• https://youtube.com/watch?v=ID\n` +
            `• https://youtu.be/ID\n` +
            `• https://youtube.com/shorts/ID\n` +
            `• https://youtube.com/live/ID\n\n` +
            `*Example:*\n` +
            `${PREFIX}play https://youtube.com/shorts/dxt5Zx-VEAU`
          );
          return;
        }
      } else {
        // Search for video
        try {
          const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(q)}`, {
            timeout: 15000
          });
          
          const videos = searchResponse.data?.result;
          
          if (!Array.isArray(videos) || videos.length === 0) {
            await sock.sendMessage(chatId, {
              react: { text: "❌", key: m.key }
            });
            await sendMessage(`❌ No results for "${q}"`);
            return;
          }

          const firstVideo = videos[0];
          videoUrl = firstVideo.url;
          videoTitle = firstVideo.title || "Unknown Song";
          
        } catch (searchError) {
          console.error('Search error:', searchError);
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage("❌ Search failed");
          return;
        }
      }

      // Download
      await sock.sendMessage(chatId, {
        react: { text: "📥", key: m.key }
      });

      try {
        const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`, {
          timeout: 30000
        });
        
        const downloadUrl = downloadResponse.data?.result;
        
        if (!downloadUrl) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage("❌ Download failed - No audio URL returned");
          return;
        }

        const fileName = `${videoTitle.substring(0, 50)}.mp3`.replace(/[^\w\s.-]/gi, '');
        
        // Send as audio only
        await sock.sendMessage(chatId, {
          react: { text: "✅", key: m.key }
        });
        
        await sock.sendMessage(chatId, {
          audio: { url: downloadUrl },
          mimetype: "audio/mpeg",
          fileName: fileName,
          caption: `🎵 ${videoTitle}`
        }, { quoted: m });

        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`🎵 Audio by: ${cleaned.cleanNumber} - "${videoTitle}"`);
        
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        await sock.sendMessage(chatId, {
          react: { text: "❌", key: m.key }
        });
        await sendMessage("❌ Download failed. Try different song.");
      }
      
    } catch (error) {
      console.error('Play error:', error);
      await sock.sendMessage(chatId, {
        react: { text: "💥", key: m.key }
      });
      await sendMessage(`❌ Error: ${error.message}`);
    }
  }
};
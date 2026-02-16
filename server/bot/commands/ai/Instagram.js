import axios from 'axios';

export default {
  name: "instagram",
  alias: ["insta", "igdl", "ig", "igvideo"],
  description: "Download Instagram videos",
  category: "Downloader",
  usage: ".instagram <instagram_url>",
  
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
          `\u250C\u2500\u29ED *Instagram Downloader*\n` +
          `\u2502 Download videos from Instagram\n` +
          `\u2502\n` +
          `\u2502 Usage:\n` +
          `\u2502 ${PREFIX}instagram <instagram_url>\n` +
          `\u2502\n` +
          `\u2502 Examples:\n` +
          `\u2502 ${PREFIX}ig https://instagram.com/reel/xyz/\n` +
          `\u2502 ${PREFIX}ig https://instagram.com/p/xyz/\n` +
          `\u2502\n` +
          `\u2502 Supported: Reels, Posts, IGTV, Stories\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      const instaRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p|tv|stories)\/[a-zA-Z0-9_-]+\/?/i;
      
      if (!instaRegex.test(q)) {
        return sendMessage(
          `\u250C\u2500\u29ED *Error*\n` +
          `\u2502 Invalid Instagram URL\n` +
          `\u2502\n` +
          `\u2502 Valid formats:\n` +
          `\u2502 instagram.com/reel/xyz/\n` +
          `\u2502 instagram.com/p/xyz/\n` +
          `\u2502 instagram.com/tv/xyz/\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      await sendReaction("\uD83D\uDCE5");
      await sendMessage(`\u250C\u2500\u29ED *Processing...*\n\u2502 Downloading Instagram video...\n\u2514\u2500\u29ED`);
      
      let videoUrl = null;
      const endpoints = [
        `https://apiskeith.vercel.app/download/instadl?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/api/instagram?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/ig/dl?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/social/instagram?url=${encodeURIComponent(q)}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            }
          });
          
          if (response.data?.result) {
            videoUrl = response.data.result;
            break;
          } else if (response.data?.url) {
            videoUrl = response.data.url;
            break;
          } else if (response.data?.videoUrl) {
            videoUrl = response.data.videoUrl;
            break;
          } else if (response.data?.downloadUrl) {
            videoUrl = response.data.downloadUrl;
            break;
          } else if (response.data?.links && Array.isArray(response.data.links)) {
            const videos = response.data.links.filter(link => 
              link.quality && link.url.includes('.mp4')
            );
            if (videos.length > 0) {
              videoUrl = videos[0].url;
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }
      
      if (!videoUrl) {
        return sendMessage(
          `\u250C\u2500\u29ED *Error*\n` +
          `\u2502 Failed to download video\n` +
          `\u2502\n` +
          `\u2502 Possible reasons:\n` +
          `\u2502 - Video is private\n` +
          `\u2502 - Account is private\n` +
          `\u2502 - Rate limited\n` +
          `\u2502\n` +
          `\u2502 Try public videos only\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Sending...*\n\u2502 Video found! Sending...\n\u2514\u2500\u29ED`);
      
      try {
        await sock.sendMessage(chatId, {
          video: { 
            url: videoUrl,
            mimetype: "video/mp4",
            caption: `\u250C\u2500\u29ED *Instagram Video*\n\u2502 Source: ${q}\n\u2514\u2500\u29ED`
          },
          gifPlayback: false
        }, { quoted: m });
        
        await sendReaction("\u2705");
        
      } catch (sendError) {
        console.error('Video send error:', sendError);
        
        if (sendError.message?.includes('too large') || sendError.message?.includes('size')) {
          await sendMessage(
            `\u250C\u2500\u29ED *Error*\n` +
            `\u2502 Video too large for WhatsApp\n` +
            `\u2502 WhatsApp limit: 64MB\n` +
            `\u2502\n` +
            `\u2502 Download link:\n` +
            `\u2502 ${videoUrl}\n` +
            `\u2514\u2500\u29ED`
          );
        } else {
          await sendMessage(
            `\u250C\u2500\u29ED *Error*\n` +
            `\u2502 Failed to send video\n` +
            `\u2502\n` +
            `\u2502 Direct download link:\n` +
            `\u2502 ${videoUrl}\n` +
            `\u2514\u2500\u29ED`
          );
        }
      }
      
    } catch (error) {
      console.error('Instagram command error:', error);
      
      let errorDetail = "Failed to download Instagram video.";
      if (error.message?.includes('timeout')) {
        errorDetail = "Request timeout. Try again.";
      } else if (error.message?.includes('Network Error')) {
        errorDetail = "Network error. Check connection.";
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Error*\n\u2502 ${errorDetail}\n\u2502 Make sure the URL is correct\n\u2514\u2500\u29ED`);
    }
  }
};
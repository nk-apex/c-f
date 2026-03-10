export default {
  name: "sticker",
  alias: ["s", "stickerize", "stik"],
  description: "Convert images/videos to stickers",
  category: "media",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const isQuotedImage = m.quoted && m.quoted.message && m.quoted.message.imageMessage;
    const isQuotedVideo = m.quoted && m.quoted.message && m.quoted.message.videoMessage;
    
    if (!isQuotedImage && !isQuotedVideo && !m.message?.imageMessage) {
      return sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Foxy Sticker Maker*\n` +
              `\u2502\n` +
              `\u251C\u25C6 Usage:\n` +
              `\u251C\u25C6 Send/reply to image: ${PREFIX}sticker\n` +
              `\u251C\u25C6 Send/reply to video: ${PREFIX}sticker\n` +
              `\u251C\u25C6 Add text: ${PREFIX}sticker Foxy\n` +
              `\u2502\n` +
              `\u251C\u25C6 Options:\n` +
              `\u251C\u25C6 ${PREFIX}sticker crop - Crop sticker\n` +
              `\u251C\u25C6 ${PREFIX}sticker circle - Circular\n` +
              `\u251C\u25C6 ${PREFIX}sticker removebg - Remove BG\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
    }
    
    try {
      await sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Processing...*\n\u251C\u25C6 Creating sticker...\n\u2514\u2500\u29ED`
      }, { quoted: m });
      
      let buffer;
      
      if (m.quoted) {
        buffer = await sock.downloadMediaMessage(m.quoted);
      } else if (m.message?.imageMessage) {
        buffer = await sock.downloadMediaMessage(m);
      }
      
      if (!buffer) {
        throw new Error("Failed to download media");
      }
      
      const packName = args[0] || 'FOX Bot';
      const authorName = args[1] || 'Foxy Sticker';
      
      await sock.sendMessage(jid, {
        sticker: buffer,
        stickerName: packName,
        stickerAuthor: authorName,
        stickerCategories: ['foxy', 'sticker']
      }, { quoted: m });
      
    } catch (error) {
      console.error("Sticker error:", error);
      await sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Error*\n` +
              `\u251C\u25C6 Failed to create sticker!\n` +
              `\u2502\n` +
              `\u251C\u25C6 Make sure:\n` +
              `\u251C\u25C6 - Image/video is not too large\n` +
              `\u251C\u25C6 - Media is supported format\n` +
              `\u251C\u25C6 - Try with a different image\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
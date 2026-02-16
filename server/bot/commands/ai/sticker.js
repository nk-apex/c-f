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
              `\u2502 Usage:\n` +
              `\u2502 Send/reply to image: ${PREFIX}sticker\n` +
              `\u2502 Send/reply to video: ${PREFIX}sticker\n` +
              `\u2502 Add text: ${PREFIX}sticker Foxy\n` +
              `\u2502\n` +
              `\u2502 Options:\n` +
              `\u2502 ${PREFIX}sticker crop - Crop sticker\n` +
              `\u2502 ${PREFIX}sticker circle - Circular\n` +
              `\u2502 ${PREFIX}sticker removebg - Remove BG\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
    }
    
    try {
      await sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Creating sticker...\n\u2514\u2500\u29ED`
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
      
      const packName = args[0] || 'Foxy Bot';
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
              `\u2502 Failed to create sticker!\n` +
              `\u2502\n` +
              `\u2502 Make sure:\n` +
              `\u2502 - Image/video is not too large\n` +
              `\u2502 - Media is supported format\n` +
              `\u2502 - Try with a different image\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};
export default {
  name: "hug",
  alias: ["hugg", "virtualhug"],
  description: "Send a virtual hug to someone",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const sender = m.pushName || "Someone";
    
    let target = "";
    if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      const mentioned = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      
      try {
        const contact = await sock.onWhatsApp(mentioned);
        if (contact[0]?.exists) {
          target = contact[0].verifiedName || contact[0].name || "them";
        }
      } catch (err) {
        target = "them";
      }
    } else {
      target = "everyone";
    }
    
    const hugGifs = [
      "https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
      "https://media.giphy.com/media/3ZnBrkqoaI2hq/giphy.gif",
      "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
      "https://media.giphy.com/media/IRUb7GTCaPU8E/giphy.gif"
    ];
    
    const hugMsg = `🤗 *VIRTUAL HUG*\n\n` +
                  `${sender} sends a warm hug to ${target}! 💕\n\n` +
                  `🫂 Spread the love!`;
    
    try {
      // Try to send with GIF
      await sock.sendMessage(jid, {
        video: { url: hugGifs[Math.floor(Math.random() * hugGifs.length)] },
        caption: hugMsg,
        gifPlayback: true
      }, { quoted: m });
    } catch (error) {
      // Fallback to text
      await sock.sendMessage(jid, {
        text: hugMsg + "\n\n🫂 *hugs*"
      }, { quoted: m });
    }
    
    return;
  }
};
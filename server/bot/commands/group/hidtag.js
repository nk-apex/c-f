export default {
  name: "hidtag",
  alias: ["hidetag", "stealthtag", "tagall"],
  description: "Tag all members without showing mentions",
  category: "group",
  ownerOnly: false,
  groupOnly: true,
  adminOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    try {
      const groupMetadata = await sock.groupMetadata(jid);
      const participants = groupMetadata.participants;
      
      const message = args.join(" ") || "";
      
      if (!message) {
        return sock.sendMessage(jid, {
          text: `❌ Please provide a message\nExample: ${PREFIX}tagall Hello everyone`
        }, { quoted: m });
      }
      
      // Zero-width space character (invisible)
      const invisibleChar = "‎";
      
      return sock.sendMessage(jid, {
        text: `${message}${invisibleChar}`,
        mentions: participants.map(p => p.id)
      }, { quoted: m });
      
    } catch (error) {
      return sock.sendMessage(jid, {
        text: `❌ Failed: ${error.message}`
      }, { quoted: m });
    }
  }
};
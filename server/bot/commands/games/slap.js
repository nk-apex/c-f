export default {
  name: "slap",
  alias: ["hit", "punch"],
  description: "Slap someone virtually",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const sender = m.pushName || "Someone";
    
    let target = "themselves";
    if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      const mentioned = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      
      // Check if it's self
      const senderJid = m.key.participant || jid;
      if (mentioned === senderJid) {
        target = "themselves (weird flex but ok)";
      } else {
        try {
          const contact = await sock.onWhatsApp(mentioned);
          if (contact[0]?.exists) {
            target = contact[0].verifiedName || contact[0].name || "them";
          }
        } catch (err) {
          target = "them";
        }
      }
    }
    
    const slapMessages = [
      `${sender} slaps ${target} with a large trout! 🐟`,
      `${sender} gives ${target} a mighty slap! 👋`,
      `${sender} delivers a powerful slap to ${target}! 💥`,
      `SLAP! ${sender} hits ${target} right in the face! 😵`,
      `${sender} uses SLAP! It's super effective on ${target}! ⚡`
    ];
    
    const slapMsg = slapMessages[Math.floor(Math.random() * slapMessages.length)];
    
    return sock.sendMessage(jid, {
      text: `👋 *SLAP ACTION*\n\n${slapMsg}`
    }, { quoted: m });
  }
};
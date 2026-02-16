export default {
  name: "ownerinfo",
  alias: ["owner", "creator", "dev"],
  description: "Show bot owner information",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const { jidManager } = extra;
    
    const ownerInfo = jidManager.getOwnerInfo ? jidManager.getOwnerInfo() : {};
    
    const ownerMsg = `👑 *BOT OWNER*\n\n` +
                    `🦊 Creator: Leon\n` +
                    `📱 Number: ${ownerInfo.cleanNumber || '+254 751 228 167'}\n` +
                    `🌍 Country: Kenya 🇰🇪\n\n` +
                    `💼 Developer Experience:\n` +
                    `• WhatsApp Bot Specialist\n` +
                    `• JavaScript/Node.js Expert\n` +
                    `• Full-Stack Developer\n\n` +
                    `📚 Skills:\n` +
                    `├─ WhatsApp Baileys API\n` +
                    `├─ Bot Development\n` +
                    `├─ Economy Systems\n` +
                    `├─ Game Development\n` +
                    `└─ AI Integration\n\n` +
                    `🔗 Contact for:\n` +
                    `• Custom bots\n` +
                    `• Bug reports\n` +
                    `• Feature requests\n\n` +
                    `💡 Bot created with ❤️ by Leon`;
    
    return sock.sendMessage(jid, {
      text: ownerMsg
    }, { quoted: m });
  }
};
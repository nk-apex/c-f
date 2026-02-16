export default {
  name: "onlyadmins",
  alias: ["adminonly", "restrict"],
  description: "Restrict commands to admins only",
  category: "group",
  ownerOnly: false,
  groupOnly: true,
  adminOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const action = args[0]?.toLowerCase();
    const status = action === "on" ? "enabled" : 
                   action === "off" ? "disabled" : 
                   "toggle";
    
    const statusMsg = `👑 *ADMIN-ONLY MODE*\n\n` +
                     `Status: ${status === "enabled" ? "✅ ON" : "❌ OFF"}\n\n` +
                     `When enabled:\n` +
                     `• Only admins can use bot commands\n` +
                     `• Regular members get "admin only" error\n` +
                     `• Economy/games still work for all\n\n` +
                     `Commands:\n` +
                     `${PREFIX}onlyadmins on - Enable admin-only\n` +
                     `${PREFIX}onlyadmins off - Disable (all can use)\n\n` +
                     `💡 Useful for controlling bot usage\n` +
                     `⚠️ Economy commands always work for all`;
    
    return sock.sendMessage(jid, {
      text: statusMsg
    }, { quoted: m });
  }
};
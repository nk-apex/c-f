export default {
  name: "status",
  alias: ["botstatus", "health", "info"],
  description: "Check bot health and statistics",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const { commands } = extra || {};
    
    const totalCommands = commands?.size || 0;
    const categories = {
      economy: 12,
      games: 12,
      group: 21,
      tools: 21,
      system: 6,
      general: 7
    };
    
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const statusMsg = `📊 *BOT STATUS*\n\n` +
                     `🦊 Name: Foxy Bot\n` +
                     `⚡ Version: 2.0.0\n` +
                     `👑 Owner: Leon\n` +
                     `⏳ Uptime: ${hours}h ${minutes}m\n\n` +
                     `📁 Commands: ${totalCommands}+\n` +
                     `├─ 💰 Economy: ${categories.economy}\n` +
                     `├─ 🎮 Games: ${categories.games}\n` +
                     `├─ 👥 Group: ${categories.group}\n` +
                     `├─ 🛠️ Tools: ${categories.tools}\n` +
                     `├─ 🔧 System: ${categories.system}\n` +
                     `└─ 📊 General: ${categories.general}\n\n` +
                     `🔧 Mode: ${global.BOT_MODE || 'public'}\n` +
                     `🔣 Prefix: "${PREFIX}"\n` +
                     `🎨 Menu Style: ${global.MENU_STYLE || 1}/7\n\n` +
                     `🟢 Status: Operational\n` +
                     `💡 All systems normal`;
    
    return sock.sendMessage(jid, {
      text: statusMsg
    }, { quoted: m });
  }
};
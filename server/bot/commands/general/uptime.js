export default {
  name: "uptime",
  alias: ["runtime", "online"],
  description: "Check bot uptime",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const start = Date.now();

    const sentMsg = await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Checking...*\n\u251C\u25C6 Calculating uptime...\n\u2514\u2500\u29ED`
    }, { quoted: m });

    const latency = Date.now() - start;

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}d `;
    if (hours > 0) uptimeStr += `${hours}h `;
    uptimeStr += `${minutes}m ${seconds}s`;

    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.rss / 1024 / 1024);

    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Foxy Uptime*\n\u251C\u25C6 Status: Online\n\u251C\u25C6 Uptime: ${uptimeStr}\n\u251C\u25C6 Memory: ${usedMB} MB\n\u251C\u25C6 Speed: ${latency}ms\n\u2514\u2500\u29ED`,
      edit: sentMsg.key
    });
  }
};

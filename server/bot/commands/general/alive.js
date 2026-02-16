export default {
  name: "alive",
  alias: ["bot", "isalive"],
  description: "Check if bot is alive",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const start = Date.now();

    const sentMsg = await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Checking...*\n\u2502 Testing connection...\n\u2514\u2500\u29ED`
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

    await sock.sendMessage(chatId, {
      text: `\u250C\u2500\u29ED *Foxy is Alive*\n\u2502 Status: Running\n\u2502 Uptime: ${uptimeStr}\n\u2502 Speed: ${latency}ms\n\u2514\u2500\u29ED`,
      edit: sentMsg.key
    });
  }
};

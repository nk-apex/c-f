function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let str = '';
  if (d > 0) str += `${d}d `;
  if (h > 0) str += `${h}h `;
  str += `${m}m ${s}s`;
  return str.trim();
}

export default {
  name: "alive",
  alias: ["bot", "isalive"],
  description: "Check if bot is alive",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const sentMsg = await sock.sendMessage(chatId, {
      text: `┌─⧭ *Checking...*\n├◆ Testing connection...\n└─⧭`
    }, { quoted: m });

    const uptime = formatUptime(Math.floor(process.uptime()));

    await sock.sendMessage(chatId, {
      text: `┌─⧭ FOXY Alive ✓\n├◆ FOXY Uptime: ${uptime}\n└─⧭`,
      edit: sentMsg.key
    });
  }
};

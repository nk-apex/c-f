export default {
  name: "uptime",
  alias: ["runtime", "alive", "online"],
  description: "Check bot uptime and status",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const memory = process.memoryUsage();
    const usedMem = Math.round(memory.rss / 1024 / 1024);
    const heapUsed = Math.round(memory.heapUsed / 1024 / 1024);
    
    const startTime = new Date(Date.now() - uptime * 1000);
    
    const uptimeMsg = `⏱️ *BOT UPTIME*\n\n` +
                     `🟢 Status: Online & Running\n` +
                     `📅 Started: ${startTime.toLocaleString()}\n` +
                     `⏳ Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s\n\n` +
                     `💾 Memory Usage:\n` +
                     `├─ RSS: ${usedMem} MB\n` +
                     `├─ Heap: ${heapUsed} MB\n` +
                     `└─ Total: ${Math.round(usedMem + heapUsed)} MB\n\n` +
                     `⚡ Node.js: ${process.version}\n` +
                     `🦊 Bot: Foxy Bot v2.0.0\n\n` +
                     `💡 Last restart: ${startTime.toLocaleDateString()}`;
    
    return sock.sendMessage(jid, {
      text: uptimeMsg
    }, { quoted: m });
  }
};
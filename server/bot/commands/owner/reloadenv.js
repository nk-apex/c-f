import os from 'os';

export default {
    name: 'reloadenv',
    alias: [],
    category: 'owner',
    description: 'Show current environment info',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const mem = process.memoryUsage();
        const uptimeSec = process.uptime();
        const hours = Math.floor(uptimeSec / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = Math.floor(uptimeSec % 60);

        const text = `\u250C\u2500\u29ED *Environment Info*\n` +
            `\u251C\u25C6 Node: ${process.version}\n` +
            `\u251C\u25C6 Platform: ${process.platform}\n` +
            `\u251C\u25C6 Arch: ${process.arch}\n` +
            `\u251C\u25C6 OS: ${os.type()} ${os.release()}\n` +
            `\u251C\u25C6 Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
            `\u251C\u25C6 RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 External: ${(mem.external / 1024 / 1024).toFixed(2)} MB\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

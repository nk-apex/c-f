import os from 'os';

export default {
    name: 'disk',
    alias: ['storage'],
    category: 'owner',
    description: 'Show disk and memory usage',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const proc = process.memoryUsage();

        const text = `\u250C\u2500\u29ED *System Memory*\n` +
            `\u251C\u25C6 Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `\u251C\u25C6 Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `\u251C\u25C6 Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `\u251C\u25C6 Usage: ${((usedMem / totalMem) * 100).toFixed(1)}%\n` +
            `\u2514\u2500\u29ED\n\n` +
            `\u250C\u2500\u29ED *Process Memory*\n` +
            `\u251C\u25C6 RSS: ${(proc.rss / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Heap Used: ${(proc.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Heap Total: ${(proc.heapTotal / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 External: ${(proc.external / 1024 / 1024).toFixed(2)} MB\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

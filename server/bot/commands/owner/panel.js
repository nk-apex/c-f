import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch {}
    return { prefix: '.', mode: 'public', ownerNumber: '', botName: 'Foxy Bot' };
}

export default {
    name: 'panel',
    alias: ['dashboard', 'cpanel'],
    category: 'owner',
    description: 'Show bot dashboard overview',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const mem = process.memoryUsage();
        const uptimeSec = process.uptime();
        const hours = Math.floor(uptimeSec / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = Math.floor(uptimeSec % 60);

        const commandCount = extra?.commands instanceof Map ? extra.commands.size : 0;
        const ownerNum = config.ownerNumber || 'Not set';

        const text = `\u250C\u2500\u29ED *Bot Dashboard*\n` +
            `\u251C\u25C6 Name: ${config.botName || 'Foxy Bot'}\n` +
            `\u251C\u25C6 Prefix: ${config.prefix || PREFIX}\n` +
            `\u251C\u25C6 Mode: ${config.mode || 'public'}\n` +
            `\u251C\u25C6 Owner: ${ownerNum}\n` +
            `\u2514\u2500\u29ED\n\n` +
            `\u250C\u2500\u29ED *Runtime*\n` +
            `\u251C\u25C6 Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
            `\u251C\u25C6 Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
            `\u251C\u25C6 Commands: ${commandCount}\n` +
            `\u251C\u25C6 Platform: ${os.platform()}\n` +
            `\u251C\u25C6 Node: ${process.version}\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

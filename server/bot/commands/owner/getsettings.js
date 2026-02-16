import fs from 'fs';
import path from 'path';

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
    name: 'getsettings',
    alias: ['settings', 'config'],
    category: 'owner',
    description: 'Show all bot configuration settings',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const keys = Object.keys(config);

        let settingsList = '';
        for (const key of keys) {
            const val = typeof config[key] === 'object' ? JSON.stringify(config[key]) : config[key];
            settingsList += `\u251C\u25C6 ${key}: ${val}\n`;
        }

        const text = `\u250C\u2500\u29ED *Bot Settings*\n` +
            `${settingsList}` +
            `\u2514\u2500\u29ED\n\n` +
            `\u250C\u2500\u29ED *Usage*\n` +
            `\u251C\u25C6 ${PREFIX}setsetting <key> <value>\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

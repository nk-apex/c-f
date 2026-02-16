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
    name: 'about',
    alias: [],
    description: 'Show bot information',
    category: 'owner',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const commandCount = extra.commands ? extra.commands.size : 0;

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *About ${config.botName}*\n\u251C\u25C6 Name: ${config.botName}\n\u251C\u25C6 Version: 1.0.8\n\u251C\u25C6 Prefix: ${config.prefix}\n\u251C\u25C6 Mode: ${config.mode}\n\u251C\u25C6 Commands: ${commandCount}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

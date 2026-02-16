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
    name: 'owner',
    alias: ['creator', 'dev'],
    description: 'Show bot owner contact info',
    category: 'owner',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();

        if (!config.ownerNumber) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Owner Info*\n\u251C\u25C6 No owner configured\n\u251C\u25C6 Owner can use ${PREFIX}iamowner to claim\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Owner Info*\n\u251C\u25C6 Number: ${config.ownerNumber}\n\u251C\u25C6 Contact: wa.me/${config.ownerNumber}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

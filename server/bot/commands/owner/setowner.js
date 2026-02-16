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

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export default {
    name: 'setowner',
    alias: [],
    description: 'Set the bot owner number',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        if (!args[0]) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Set Owner*\n\u251C\u25C6 Usage: ${PREFIX}setowner <number>\n\u251C\u25C6 Example: ${PREFIX}setowner 254712345678\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const number = args[0].replace(/[^0-9]/g, '');

        if (number.length < 7 || number.length > 15) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Invalid Number*\n\u251C\u25C6 Number must be 7-15 digits\n\u251C\u25C6 Only digits allowed\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const config = loadConfig();
        const oldOwner = config.ownerNumber || 'None';
        config.ownerNumber = number;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Owner Updated*\n\u251C\u25C6 Old: ${oldOwner}\n\u251C\u25C6 New: ${number}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

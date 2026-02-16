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
    name: 'setfooter',
    alias: [],
    description: 'Set or view the bot footer text',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();

        if (!args[0]) {
            const currentFooter = config.footer || 'Not set';
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Footer Config*\n\u251C\u25C6 Current: ${currentFooter}\n\u251C\u25C6 Usage: ${PREFIX}setfooter <text>\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const footerText = args.join(' ').trim();
        config.footer = footerText;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Footer Updated*\n\u251C\u25C6 Footer: ${footerText}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

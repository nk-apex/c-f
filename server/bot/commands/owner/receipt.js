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
    name: 'receipt',
    alias: ['readreceipt', 'blueTick'],
    category: 'owner',
    description: 'Toggle read receipts (blue ticks)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const current = config.readReceipts !== false;
        const newValue = !current;

        config.readReceipts = newValue;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Read Receipts*\n\u251C\u25C6 Status: ${newValue ? 'Enabled' : 'Disabled'}\n\u251C\u25C6 Blue ticks will ${newValue ? 'be sent' : 'not be sent'}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

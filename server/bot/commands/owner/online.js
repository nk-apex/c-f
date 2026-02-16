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
    name: 'online',
    alias: ['presence'],
    category: 'owner',
    description: 'Toggle bot online presence',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const currentStatus = config.onlinePresence !== false;
        const newStatus = !currentStatus;

        config.onlinePresence = newStatus;
        saveConfig(config);

        const presenceType = newStatus ? 'available' : 'unavailable';

        try {
            await sock.sendPresenceUpdate(presenceType, chatId);
        } catch {}

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Presence Updated*\n\u251C\u25C6 Status: ${newStatus ? 'Online' : 'Offline'}\n\u251C\u25C6 Presence: ${presenceType}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

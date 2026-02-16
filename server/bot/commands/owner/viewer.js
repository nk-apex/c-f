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
    name: 'viewer',
    alias: ['statusviewer', 'storyviewer'],
    category: 'owner',
    description: 'Toggle auto status viewing',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const current = config.autoStatusView === true;
        const newValue = !current;

        config.autoStatusView = newValue;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Auto Status Viewer*\n\u251C\u25C6 Status: ${newValue ? 'Enabled' : 'Disabled'}\n\u251C\u25C6 Bot will ${newValue ? 'automatically view' : 'not view'} status updates\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

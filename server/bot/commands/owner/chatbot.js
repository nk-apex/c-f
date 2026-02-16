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
    name: 'chatbot',
    alias: [],
    description: 'Toggle chatbot mode on/off',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        config.chatbot = !config.chatbot;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Chatbot Mode*\n\u251C\u25C6 Status: ${config.chatbot ? 'Enabled' : 'Disabled'}\n\u251C\u25C6 ${config.chatbot ? 'Bot will respond to all messages' : 'Bot responds to commands only'}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

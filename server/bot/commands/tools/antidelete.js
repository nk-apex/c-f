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
    name: 'antidelete',
    alias: ['undelete', 'antidel'],
    description: 'Toggle anti-delete message detection',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const action = args[0]?.toLowerCase();

        if (!action) {
            const status = config.antidelete ? 'ON' : 'OFF';
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete*\n\u251C\u25C6 Status: ${status}\n\u251C\u25C6 On: ${PREFIX}antidelete on\n\u251C\u25C6 Off: ${PREFIX}antidelete off\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        if (action === 'on' || action === 'enable') {
            config.antidelete = true;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete Enabled*\n\u251C\u25C6 Deleted messages will be captured\n\u251C\u25C6 Turn off: ${PREFIX}antidelete off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else if (action === 'off' || action === 'disable') {
            config.antidelete = false;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete Disabled*\n\u251C\u25C6 Deleted messages will not be tracked\n\u251C\u25C6 Turn on: ${PREFIX}antidelete on\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete*\n\u251C\u25C6 Usage: ${PREFIX}antidelete on/off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};

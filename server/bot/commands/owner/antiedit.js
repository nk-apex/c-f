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
    name: 'antiedit',
    alias: ['unedit', 'editdetect'],
    description: 'Toggle anti-edit message detection',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const action = args[0]?.toLowerCase();

        if (!action) {
            const status = config.antiedit ? 'ON' : 'OFF';
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Edit*\n\u251C\u25C6 Status: ${status}\n\u251C\u25C6 Captures original message before edit\n\u251C\u25C6 On: ${PREFIX}antiedit on\n\u251C\u25C6 Off: ${PREFIX}antiedit off\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        if (action === 'on' || action === 'enable') {
            config.antiedit = true;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Edit Enabled*\n\u251C\u25C6 Edited messages will show original text\n\u251C\u25C6 Turn off: ${PREFIX}antiedit off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else if (action === 'off' || action === 'disable') {
            config.antiedit = false;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Edit Disabled*\n\u251C\u25C6 Turn on: ${PREFIX}antiedit on\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Usage*\n\u251C\u25C6 ${PREFIX}antiedit on/off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};

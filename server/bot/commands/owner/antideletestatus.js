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
    name: 'antideletestatus',
    alias: ['antidelstatus', 'statusantidel'],
    description: 'Toggle anti-delete for status/stories',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const action = args[0]?.toLowerCase();

        if (!action) {
            const status = config.antideletestatus ? 'ON' : 'OFF';
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete Status*\n\u251C\u25C6 Status: ${status}\n\u251C\u25C6 Captures deleted statuses/stories\n\u251C\u25C6 On: ${PREFIX}antideletestatus on\n\u251C\u25C6 Off: ${PREFIX}antideletestatus off\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        if (action === 'on' || action === 'enable') {
            config.antideletestatus = true;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete Status Enabled*\n\u251C\u25C6 Deleted statuses will be captured\n\u251C\u25C6 Turn off: ${PREFIX}antideletestatus off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else if (action === 'off' || action === 'disable') {
            config.antideletestatus = false;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Anti-Delete Status Disabled*\n\u251C\u25C6 Turn on: ${PREFIX}antideletestatus on\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Usage*\n\u251C\u25C6 ${PREFIX}antideletestatus on/off\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};

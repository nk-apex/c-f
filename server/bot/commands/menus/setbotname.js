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
    name: 'setbotname',
    alias: ['changename', 'renamebot', 'botname'],
    category: 'system',
    description: 'Change the bot display name (Owner only)',
    ownerOnly: true,

    async execute(sock, msg, args, prefix, context) {
        const chatId = msg.key.remoteJid;

        if (args.length === 0) {
            const config = loadConfig();
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Bot Name*\n\u251C\u25C6 Current: ${config.botName}\n\u251C\u25C6 Usage: ${prefix}setbotname <new name>\n\u251C\u25C6 Example: ${prefix}setbotname Foxy Master\n\u2514\u2500\u29ED`
            }, { quoted: msg });
            return;
        }

        const newName = args.join(' ').trim();

        if (newName.length > 30) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Name too long (max 30 chars)\n\u251C\u25C6 Your input: ${newName.length} chars\n\u2514\u2500\u29ED`
            }, { quoted: msg });
            return;
        }

        if (newName.length < 2) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Name too short (min 2 chars)\n\u2514\u2500\u29ED`
            }, { quoted: msg });
            return;
        }

        const config = loadConfig();
        const oldName = config.botName;
        config.botName = newName;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Bot Name Updated*\n\u251C\u25C6 Old: ${oldName}\n\u251C\u25C6 New: ${newName}\n\u2514\u2500\u29ED`
        }, { quoted: msg });
    }
};

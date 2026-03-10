import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function safeReadJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch {}
    return null;
}

export default {
    name: 'prefix',
    alias: ['myprefix', 'whatprefix', 'getprefix'],
    category: 'utility',
    description: 'Check the current bot prefix (works without prefix)',
    prefixless: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;

        if (extra && typeof extra.isOwner === 'function' && !extra.isOwner()) {
            return;
        }

        const prefixData = safeReadJSON(path.join(__dirname, '../../data/prefix.json'));
        const settingsData = safeReadJSON(path.join(__dirname, '../../settings.json'));
        const botSettings = safeReadJSON(path.join(__dirname, '../../bot_settings.json'));

        let currentPrefix = '?';
        let isPrefixless = false;

        if (prefixData) {
            if (prefixData.isPrefixless) {
                isPrefixless = true;
                currentPrefix = 'none';
            } else if (prefixData.prefix) {
                currentPrefix = prefixData.prefix;
            }
        } else if (settingsData?.prefix) {
            currentPrefix = settingsData.prefix;
        } else if (botSettings?.prefix) {
            currentPrefix = botSettings.prefix;
        } else if (global.CURRENT_PREFIX) {
            currentPrefix = global.CURRENT_PREFIX;
        } else if (global.prefix) {
            currentPrefix = global.prefix;
        } else if (process.env.PREFIX) {
            currentPrefix = process.env.PREFIX;
        }

        let text = `┌─⧭ 🐺 *BOT PREFIX* \n`;
        text += ``;

        if (isPrefixless) {
            text += `├◆ ✧ *Mode:* Prefixless\n`;
            text += `├◆ ✧ *Prefix:* Not required\n`;
            text += ``;
            text += `├◆ 💡 Type any command directly\n`;
            text += `├◆ • \`ping\`\n`;
            text += `├◆ • \`menu\`\n`;
            text += `├◆ • \`alive\`\n`;
        } else {
            text += `├◆ ✧ *Current Prefix:* \`${currentPrefix}\`\n`;
            text += ``;
            text += `├◆ 💡 Use it before commands\n`;
            text += `├◆ • \`${currentPrefix}ping\`\n`;
            text += `├◆ • \`${currentPrefix}menu\`\n`;
            text += `├◆ • \`${currentPrefix}alive\`\n`;
        }

        text += ``;
        text += `└─⧭`;

        await sock.sendMessage(chatId, { text }, { quoted: msg });
    }
};

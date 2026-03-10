import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '..', '..', 'data', 'reactowner_config.json');

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch {}
    return { enabled: false, emoji: '🐺' };
}

function saveConfig(config) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch {}
}

export function isReactOwnerEnabled() {
    return loadConfig().enabled;
}

export function getReactOwnerEmoji() {
    return loadConfig().emoji || '🐺';
}

export async function handleReactOwner(sock, msg) {
    try {
        const config = loadConfig();
        if (!config.enabled) return;

        if (!msg?.key || !msg.message) return;

        const ts = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : 0;
        if (ts > 0 && Date.now() - ts > 30000) return;

        const remoteJid = msg.key.remoteJid || '';
        if (!remoteJid.endsWith('@g.us')) return;

        const rawSender = msg.key.participant || '';
        if (!rawSender) return;

        const isFromMe = msg.key.fromMe;
        if (!isFromMe) return;

        await sock.sendMessage(remoteJid, {
            react: { text: config.emoji || '🐺', key: msg.key }
        });
    } catch {}
}

export default {
    name: 'reactowner',
    alias: ['ownerreact', 'autoreactowner'],
    category: 'automation',
    description: 'Auto-react to owner messages in groups with a wolf emoji',
    ownerOnly: true,

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const config = loadConfig();

        if (!args[0]) {
            const status = config.enabled ? '✅ ON' : '❌ OFF';
            const emoji = config.emoji || '🐺';
            return await sock.sendMessage(chatId, {
                text: `┌─⧭ 🐺 *REACT OWNER* \n├◆ Status: ${status}\n├◆ Emoji: ${emoji}\n├◆ *reactowner on*\n├◆  └⊷ Enable auto-react\n├◆ *reactowner off*\n├◆  └⊷ Disable auto-react\n├◆ *reactowner emoji <emoji>*\n├◆  └⊷ Change emoji\n└─⧭`
            });
        }

        const action = args[0].toLowerCase();

        if (action === 'on' || action === 'enable') {
            config.enabled = true;
            saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `✅ *React Owner enabled!*\n\nEmoji: ${config.emoji || '🐺'}\n_Bot will react to your group messages_`
            });
        }

        if (action === 'off' || action === 'disable') {
            config.enabled = false;
            saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `❌ *React Owner disabled!*`
            });
        }

        if (action === 'emoji' || action === 'set') {
            const newEmoji = args.slice(1).join(' ').trim();
            if (!newEmoji) {
                return await sock.sendMessage(chatId, {
                    text: `┌─⧭ ⚠️ *REACT OWNER* \n├◆ *reactowner emoji 🐺*\n├◆  └⊷ Provide an emoji\n└─⧭`
                });
            }
            config.emoji = newEmoji;
            saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `✅ *React Owner emoji updated!*\n\nNew emoji: ${newEmoji}`
            });
        }

        return await sock.sendMessage(chatId, {
            text: `┌─⧭ ⚠️ *REACT OWNER* \n├◆ *reactowner on*\n├◆  └⊷ Enable\n├◆ *reactowner off*\n├◆  └⊷ Disable\n├◆ *reactowner emoji <emoji>*\n├◆  └⊷ Change emoji\n└─⧭`
        });
    }
};

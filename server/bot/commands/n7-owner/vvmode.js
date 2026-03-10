import fs from 'fs';
import { join } from 'path';
import db from '../../lib/supabase.js';

const CONFIG_DIR = './data/antiviewonce';
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch {}
    return { mode: 'private', ownerJid: '', sendAsSticker: false };
}

function saveConfig(config) {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch {}
    try {
        db.setConfig('antiviewonce_config', config).catch(() => {});
    } catch {}
}

export default {
    name: 'vvmode',
    alias: ['viewoncemode', 'avmode', 'vvsticker'],
    description: 'Toggle view-once download output between image and sticker',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, msg, args, prefix, extras) {
        const chatId = msg.key.remoteJid;
        const isOwner = extras?.isOwner ? extras.isOwner() : false;
        const isSudoUser = extras?.isSudo ? extras.isSudo() : false;

        if (!isOwner && !isSudoUser) {
            await sock.sendMessage(chatId, {
                text: '❌ Owner only command'
            }, { quoted: msg });
            return;
        }

        const action = args[0]?.toLowerCase();
        const config = loadConfig();
        const currentMode = config.sendAsSticker ? 'sticker' : 'image';

        if (!action || action === 'status' || action === 'check') {
            const modeEmoji = config.sendAsSticker ? '🏷️' : '🖼️';
            const modeText = config.sendAsSticker ? 'Sticker' : 'Image';
            await sock.sendMessage(chatId, {
                text: `┌─⧭ ${modeEmoji} *VIEW-ONCE MODE* \n` +
                     `│\n` +
                     `├◆ *Current:* ${modeText}\n` +
                     `│\n` +
                     `├◆ *${prefix}vvmode image*\n` +
                     `│\n` +
                     `├◆ *${prefix}vvmode sticker*\n` +
                     `│\n` +
                     `├◆ *${prefix}vvmode toggle*\n` +
                     `│\n` +
                     `└─⧭`
            }, { quoted: msg });
            return;
        }

        switch (action) {
            case 'sticker':
            case 'on': {
                config.sendAsSticker = true;
                saveConfig(config);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🏷️ *STICKER MODE ON* \n` +
                         `│\n` +
                         `├◆ View-once images will be\n` +
                         `│  sent as *stickers*\n` +
                         `├◆ Videos remain as video\n` +
                         `└─⧭`
                }, { quoted: msg });
                break;
            }
            case 'image':
            case 'off': {
                config.sendAsSticker = false;
                saveConfig(config);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🖼️ *IMAGE MODE ON* \n` +
                         `│\n` +
                         `├◆ View-once images will be\n` +
                         `│  sent as normal *images*\n` +
                         `├◆ Videos sent as normal video\n` +
                         `└─⧭`
                }, { quoted: msg });
                break;
            }
            case 'toggle':
            case 'switch': {
                config.sendAsSticker = !config.sendAsSticker;
                saveConfig(config);
                const newMode = config.sendAsSticker ? 'Sticker 🏷️' : 'Image 🖼️';
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🔄 *MODE SWITCHED* \n` +
                         `│\n` +
                         `├◆ View-once output: *${newMode}*\n` +
                         `└─⧭`
                }, { quoted: msg });
                break;
            }
            default: {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🖼️ *VIEW-ONCE MODE* \n` +
                         `│\n` +
                         `├◆ *${prefix}vvmode image*\n` +
                         `│\n` +
                         `├◆ *${prefix}vvmode sticker*\n` +
                         `│\n` +
                         `├◆ *${prefix}vvmode toggle*\n` +
                         `│\n` +
                         `└─⧭`
                }, { quoted: msg });
            }
        }
    }
};

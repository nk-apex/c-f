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

const modes = {
    'public': 'Everyone can use the bot',
    'private': 'Owner only',
    'group-only': 'Groups only, ignores DMs',
    'dms-only': 'DMs only, ignores groups',
};

export default {
    name: 'mode',
    alias: ['botmode', 'setmode'],
    category: 'system',
    description: 'Toggle bot operating mode (Owner only)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();
        const currentMode = config.mode || 'public';

        if (!args[0]) {
            let modeList = '';
            for (const [mode, desc] of Object.entries(modes)) {
                const marker = mode === currentMode ? ' [active]' : '';
                modeList += `\u251C\u2500 ${mode}${marker}\n`;
            }

            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Bot Mode*\n\u251C\u25C6 Current: ${currentMode}\n\u2514\u2500\u29ED\n\n\u250C\u2500\u29ED *Available Modes*\n${modeList}\u2514\u2500\u29ED\n\n\u250C\u2500\u29ED *Usage*\n\u251C\u25C6 ${PREFIX}mode <name>\n\u251C\u25C6 Example: ${PREFIX}mode private\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const requestedMode = args[0].toLowerCase();

        if (!modes[requestedMode]) {
            const validModes = Object.keys(modes).join(', ');
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Invalid Mode*\n\u251C\u25C6 Valid: ${validModes}\n\u251C\u25C6 Example: ${PREFIX}mode private\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        if (requestedMode === currentMode) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Already Active*\n\u251C\u25C6 Mode: ${currentMode}\n\u251C\u25C6 ${modes[currentMode]}\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const oldMode = currentMode;
        config.mode = requestedMode;
        saveConfig(config);

        if (typeof global !== 'undefined') {
            global.BOT_MODE = requestedMode;
        }

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Mode Updated*\n\u251C\u25C6 Old: ${oldMode}\n\u251C\u25C6 New: ${requestedMode}\n\u251C\u25C6 ${modes[requestedMode]}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

export function getCurrentMode() {
    try {
        const config = loadConfig();
        return config.mode || 'public';
    } catch {
        return 'public';
    }
}

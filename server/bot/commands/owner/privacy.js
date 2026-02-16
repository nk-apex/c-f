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

const privacyOptions = ['last-seen', 'profile-photo', 'about', 'groups'];

export default {
    name: 'privacy',
    alias: ['privacysettings'],
    category: 'owner',
    description: 'Show or set privacy settings',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const config = loadConfig();

        if (!config.privacy) {
            config.privacy = {
                'last-seen': 'contacts',
                'profile-photo': 'all',
                'about': 'all',
                'groups': 'all'
            };
            saveConfig(config);
        }

        if (!args[0]) {
            let privList = '';
            for (const opt of privacyOptions) {
                privList += `\u251C\u25C6 ${opt}: ${config.privacy[opt] || 'all'}\n`;
            }

            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Privacy Settings*\n${privList}\u2514\u2500\u29ED\n\n` +
                    `\u250C\u2500\u29ED *Usage*\n` +
                    `\u251C\u25C6 ${PREFIX}privacy <option> <value>\n` +
                    `\u251C\u25C6 Options: ${privacyOptions.join(', ')}\n` +
                    `\u251C\u25C6 Values: all, contacts, none\n` +
                    `\u251C\u25C6 Example: ${PREFIX}privacy last-seen contacts\n` +
                    `\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const option = args[0].toLowerCase();
        const value = args[1]?.toLowerCase();

        if (!privacyOptions.includes(option)) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Invalid Option*\n\u251C\u25C6 Valid: ${privacyOptions.join(', ')}\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        if (!value || !['all', 'contacts', 'none'].includes(value)) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Invalid Value*\n\u251C\u25C6 Valid values: all, contacts, none\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        config.privacy[option] = value;
        saveConfig(config);

        try {
            if (option === 'last-seen' && typeof sock.updateLastSeenPrivacy === 'function') {
                await sock.updateLastSeenPrivacy(value);
            } else if (option === 'profile-photo' && typeof sock.updateProfilePicturePrivacy === 'function') {
                await sock.updateProfilePicturePrivacy(value);
            } else if (option === 'about' && typeof sock.updateStatusPrivacy === 'function') {
                await sock.updateStatusPrivacy(value);
            } else if (option === 'groups' && typeof sock.updateGroupsAddPrivacy === 'function') {
                await sock.updateGroupsAddPrivacy(value);
            }
        } catch {}

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Privacy Updated*\n\u251C\u25C6 ${option}: ${value}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

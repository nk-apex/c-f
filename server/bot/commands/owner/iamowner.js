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
    name: 'iamowner',
    alias: ['claimowner'],
    description: 'Claim bot ownership if no owner is set',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        const config = loadConfig();

        if (config.ownerNumber) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Claim Failed*\n\u251C\u25C6 Owner already set\n\u251C\u25C6 Use ${PREFIX}resetowner first\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const senderJid = m.key.participant || m.key.remoteJid;
        const senderNumber = jidManager ? jidManager.cleanJid(senderJid) : senderJid.replace(/@.*/, '');
        config.ownerNumber = senderNumber;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Owner Claimed*\n\u251C\u25C6 Number: ${senderNumber}\n\u251C\u25C6 You are now the bot owner\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

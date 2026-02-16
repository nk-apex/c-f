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
    name: 'setsetting',
    alias: [],
    category: 'owner',
    description: 'Set a specific bot config value',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        if (args.length < 2) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Set Setting*\n\u251C\u25C6 Usage: ${PREFIX}setsetting <key> <value>\n\u251C\u25C6 Example: ${PREFIX}setsetting botName MyBot\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const key = args[0];
        const value = args.slice(1).join(' ');
        const config = loadConfig();
        const oldValue = config[key] !== undefined ? config[key] : '(not set)';

        let parsedValue = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(value) && value.trim() !== '') parsedValue = Number(value);

        config[key] = parsedValue;
        saveConfig(config);

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Setting Updated*\n\u251C\u25C6 Key: ${key}\n\u251C\u25C6 Old: ${oldValue}\n\u251C\u25C6 New: ${parsedValue}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

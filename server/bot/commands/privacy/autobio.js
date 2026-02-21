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

let autoBioInterval = null;

export default {
    name: 'autobio',
    alias: ['autobout', 'autostatus'],
    category: 'privacy',
    description: 'Toggle auto bio - default: FOXY online',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const react = async (emoji) => {
            try { await sock.sendMessage(chatId, { react: { text: emoji, key: m.key } }); } catch {}
        };

        try {
            const config = loadConfig();

            if (args[0]?.toLowerCase() === 'set' && args.length > 1) {
                config.autoBioText = args.slice(1).join(' ');
                saveConfig(config);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *AUTO BIO TEXT SET*\n├◆ New text: ${config.autoBioText}\n└─⧭`
                }, { quoted: m });
                await react("✅");
                return;
            }

            const current = config.autoBio === true;
            const newValue = !current;

            config.autoBio = newValue;
            if (!config.autoBioText) {
                config.autoBioText = 'FOXY online';
            }
            saveConfig(config);

            if (newValue) {
                try {
                    await sock.updateProfileStatus(config.autoBioText);
                } catch {}

                if (autoBioInterval) clearInterval(autoBioInterval);
                autoBioInterval = setInterval(async () => {
                    try {
                        const cfg = loadConfig();
                        if (!cfg.autoBio) {
                            clearInterval(autoBioInterval);
                            autoBioInterval = null;
                            return;
                        }
                        const uptime = process.uptime();
                        const hrs = Math.floor(uptime / 3600);
                        const mins = Math.floor((uptime % 3600) / 60);
                        const bioText = `${cfg.autoBioText || 'FOXY online'} | ⏱ ${hrs}h ${mins}m`;
                        await sock.updateProfileStatus(bioText);
                    } catch {}
                }, 60000);
            } else {
                if (autoBioInterval) {
                    clearInterval(autoBioInterval);
                    autoBioInterval = null;
                }
            }

            await sock.sendMessage(chatId, {
                text: `┌─⧭ *AUTO BIO*\n├◆ Status: ${newValue ? 'ON ✅' : 'OFF ❌'}\n├◆ Text: ${config.autoBioText}\n├◆ Updates every 60 seconds with uptime\n├◆ Change text: ${PREFIX}autobio set <text>\n└─⧭`
            }, { quoted: m });

            await react(newValue ? "✅" : "❌");
        } catch (error) {
            await react("❌");
        }
    }
};

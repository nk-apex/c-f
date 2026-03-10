import fs from 'fs';

const CONFIG_FILE = './data/antigroupcall.json';
const handledCalls = new Map();
let listenerAttached = false;

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch {}
    return { enabled: false };
}

function saveConfig(data) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    } catch {}
}

export function isAntiGroupCallEnabled() {
    return loadConfig().enabled === true;
}

function setupAntiGroupCallListener(sock) {
    if (listenerAttached) return;
    listenerAttached = true;

    setInterval(() => {
        const now = Date.now();
        for (const [id, ts] of handledCalls.entries()) {
            if (now - ts > 5 * 60 * 1000) handledCalls.delete(id);
        }
    }, 60000);

    sock.ev.on('call', async (callArray) => {
        try {
            if (!isAntiGroupCallEnabled()) return;

            const calls = Array.isArray(callArray) ? callArray : [callArray];

            for (const call of calls) {
                if (call.status !== 'offer') continue;
                if (handledCalls.has(call.id)) continue;

                const fromJid = call.from || '';
                const isGroupCall = fromJid.endsWith('@g.us') || call.isGroup === true;

                if (!isGroupCall) continue;

                handledCalls.set(call.id, Date.now());

                try {
                    await sock.rejectCall(call.id, fromJid);
                } catch {}
            }
        } catch {}
    });
}

export default {
    name: 'antigroupcall',
    alias: ['antigcall', 'nographcall'],
    description: 'Auto-ignore/reject incoming group calls',
    category: 'group',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const sub = (args[0] || '').toLowerCase();

        setupAntiGroupCallListener(sock);

        const config = loadConfig();

        if (!sub || sub === 'status') {
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 📵 *ANTI GROUP CALL* ⌋\n│\n├─⊷ *Status:* ${config.enabled ? '✅ ON' : '❌ OFF'}\n│\n├─⊷ When enabled, all incoming group\n├◆  calls are automatically rejected.\n│\n├─⊷ *Usage:*\n├◆  .antigroupcall on\n├◆  .antigroupcall off\n╰───`,
            }, { quoted: msg });
        }

        if (sub === 'on') {
            saveConfig({ enabled: true });
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 📵 *ANTI GROUP CALL* ⌋\n│\n├─⊷ ✅ *ENABLED*\n├─⊷ Group calls will be automatically\n├◆  rejected/ignored.\n╰───`,
            }, { quoted: msg });
        }

        if (sub === 'off') {
            saveConfig({ enabled: false });
            return sock.sendMessage(chatId, {
                text: `╭─⌈ 📵 *ANTI GROUP CALL* ⌋\n│\n├─⊷ ❌ *DISABLED*\n├─⊷ Group calls will come through normally.\n╰───`,
            }, { quoted: msg });
        }

        return sock.sendMessage(chatId, {
            text: `╭─⌈ 📵 *ANTI GROUP CALL* ⌋\n│\n├─⊷ *Usage:*\n├◆  .antigroupcall on\n├◆  .antigroupcall off\n├◆  .antigroupcall status\n╰───`,
        }, { quoted: msg });
    }
};

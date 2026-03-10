import moment from 'moment-timezone';
import { getBotName } from '../../lib/botname.js';

function fakeContact(m) {
    const jid = m.key.participant?.split('@')[0] || m.key.remoteJid.split('@')[0];
    return {
        key: { participant: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: getBotName() },
        messageTimestamp: moment().unix(),
        pushName: getBotName(),
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${getBotName()}\nitem1.TEL;waid=${jid}:${jid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        },
        participant: "0@s.whatsapp.net"
    };
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let str = '';
    if (d > 0) str += `${d}d `;
    if (h > 0) str += `${h}h `;
    str += `${m}m ${s}s`;
    return str.trim();
}

export default {
    name: "uptime",
    alias: ["runtime", "online"],
    description: "Check bot uptime",
    category: "general",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const sentMsg = await sock.sendMessage(chatId, {
            text: `┌─⧭ *Checking...*\n├◆ Calculating uptime...\n└─⧭`
        }, { quoted: fakeContact(m) });

        const uptime = formatUptime(Math.floor(process.uptime()));

        await sock.sendMessage(chatId, {
            text: `┌─⧭ FOXY Uptime: ${uptime}\n└─⧭`,
            edit: sentMsg.key
        });
    }
};

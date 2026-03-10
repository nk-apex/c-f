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

export default {
    name: 'ping',
    alias: ['pong', 'speed', 'latency'],
    category: 'tools',
    description: 'Check bot response time',

    async execute(sock, msg, args, prefix) {
        const start = Date.now();

        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `┌─⧭ *Pinging...*\n├◆ Measuring speed...\n└─⧭`
        }, { quoted: fakeContact(msg) });

        const latency = Date.now() - start;

        await sock.sendMessage(msg.key.remoteJid, {
            text: `┌─⧭ FOXY Speed: ${latency}ms\n└─⧭`,
            edit: sentMsg.key
        });
    }
};

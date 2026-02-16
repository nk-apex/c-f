import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'ping',
    alias: ['pong', 'speed', 'latency'],
    category: 'tools',
    description: 'Check bot response time',

    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'ping')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }

        const start = Date.now();

        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `\u250C\u2500\u29ED *Pinging...*\n\u2502 Measuring speed...\n\u2514\u2500\u29ED`
        }, { quoted: msg });

        const latency = Date.now() - start;

        await sock.sendMessage(msg.key.remoteJid, {
            text: `\u250C\u2500\u29ED *Foxy Speed*\n\u2502 Response: ${latency}ms\n\u2514\u2500\u29ED`,
            edit: sentMsg.key
        });
    }
};

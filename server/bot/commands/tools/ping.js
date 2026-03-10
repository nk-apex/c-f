export default {
    name: 'ping',
    alias: ['pong', 'speed', 'latency'],
    category: 'tools',
    description: 'Check bot response time',

    async execute(sock, msg, args, prefix) {
        const start = Date.now();

        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `┌─⧭ *Pinging...*\n├◆ Measuring speed...\n└─⧭`
        }, { quoted: msg });

        const latency = Date.now() - start;

        await sock.sendMessage(msg.key.remoteJid, {
            text: `┌─⧭ FOXY Speed: ${latency}ms\n└─⧭`,
            edit: sentMsg.key
        });
    }
};

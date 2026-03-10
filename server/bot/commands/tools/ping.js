function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
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
        }, { quoted: msg });

        const latency = Date.now() - start;
        const uptime = formatUptime(Math.floor(process.uptime()));

        await sock.sendMessage(msg.key.remoteJid, {
            text: `┌─⧭ FOXY Speed: ${latency}ms\n├◆ FOXY Uptime: ${uptime}\n└─⧭`,
            edit: sentMsg.key
        });
    }
};

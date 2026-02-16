export default {
    name: 'test',
    alias: ['testbot'],
    category: 'owner',
    description: 'Test if the bot is working',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const start = Date.now();

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Bot Test*\n\u251C\u25C6 Status: Working\n\u251C\u25C6 Response Time: ${Date.now() - start}ms\n\u251C\u25C6 Bot: ${extra?.BOT_NAME || 'Foxy Bot'}\n\u251C\u25C6 Prefix: ${PREFIX}\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

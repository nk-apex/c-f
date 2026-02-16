export default {
    name: 'shutdown',
    alias: ['off', 'turnoff'],
    description: 'Shutdown the bot',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Shutting Down*\n\u251C\u25C6 Goodbye! Bot is going offline.\n\u2514\u2500\u29ED`
        }, { quoted: m });

        setTimeout(() => {
            process.exit(0);
        }, 1500);
    }
};

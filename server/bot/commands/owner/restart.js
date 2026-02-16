export default {
    name: 'restart',
    alias: ['reboot'],
    category: 'owner',
    description: 'Restart the bot process',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Restarting...*\n\u251C\u25C6 Bot is restarting now\n\u251C\u25C6 Please wait a moment\n\u2514\u2500\u29ED`
        }, { quoted: m });

        setTimeout(() => {
            process.exit(0);
        }, 1500);
    }
};

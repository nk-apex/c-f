export default {
    name: 'workingreload',
    alias: ['reload'],
    category: 'owner',
    description: 'Trigger a command reload (informational)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Command Reload*\n\u251C\u25C6 Reload signal triggered\n\u251C\u25C6 Note: For a full reload, use ${PREFIX}restart\n\u251C\u25C6 Commands will refresh on next restart\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

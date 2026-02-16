export default {
    name: 'latestupdates',
    alias: ['updates', 'changelog'],
    category: 'owner',
    description: 'Show latest bot updates and changelog',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const text = `\u250C\u2500\u29ED *Foxy Bot v1.0.8 - Changelog*\n` +
            `\u251C\u25C6 Updated command loader system\n` +
            `\u251C\u25C6 Added owner management commands\n` +
            `\u251C\u25C6 Improved privacy controls\n` +
            `\u251C\u25C6 Added system diagnostics panel\n` +
            `\u251C\u25C6 Enhanced debug and chat info tools\n` +
            `\u251C\u25C6 Added disk and memory monitoring\n` +
            `\u251C\u25C6 Improved host detection for Replit/Railway\n` +
            `\u251C\u25C6 Added command search functionality\n` +
            `\u251C\u25C6 Added read receipt toggle\n` +
            `\u251C\u25C6 Added auto status viewer toggle\n` +
            `\u251C\u25C6 Added presence control\n` +
            `\u251C\u25C6 Improved bot restart mechanism\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

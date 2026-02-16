export default {
    name: 'repo',
    alias: [],
    description: 'Show bot repository information',
    category: 'owner',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Foxy Bot Repository*\n\u251C\u25C6 Name: Foxy Bot\n\u251C\u25C6 Version: 1.0.8\n\u251C\u25C6 Platform: WhatsApp\n\u251C\u25C6 Library: Baileys\n\u251C\u25C6 Runtime: Node.js\n\u251C\u25C6 License: MIT\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

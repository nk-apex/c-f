export default {
    name: 'repo',
    alias: [],
    description: 'Show bot repository information',
    category: 'owner',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `┌─⧭ *FOXY Repository*\n├◆ Name: FOXY\n├◆ Version: 1.0.0\n├◆ Platform: WhatsApp\n├◆ Library: Baileys\n├◆ Runtime: Node.js\n├◆ License: MIT\n├◆ 🔗 https://github.com/7silent-wolf/FOXY\n└─⧭`
        }, { quoted: m });
    }
};

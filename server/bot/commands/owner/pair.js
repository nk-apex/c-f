export default {
    name: 'pair',
    alias: [],
    description: 'Show pairing instructions',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Pairing Instructions*\n\u251C\u25C6 Method 1: Pair Code\n\u251C\u25C6 Open WhatsApp > Linked Devices\n\u251C\u25C6 Tap "Link a Device"\n\u251C\u25C6 Enter the pair code provided\n\u251C\u25C6\n\u251C\u25C6 Method 2: Session ID\n\u251C\u25C6 Use your session ID to restore\n\u251C\u25C6 Place session files in /session\n\u251C\u25C6 Restart the bot to connect\n\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

export default {
    name: 'debugchat',
    alias: ['debug'],
    category: 'owner',
    description: 'Show debug info about current chat',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const isOwner = extra?.isOwner || false;

        let msgType = 'unknown';
        if (m.message) {
            const keys = Object.keys(m.message);
            msgType = keys.filter(k => k !== 'messageContextInfo').join(', ') || 'unknown';
        }

        const text = `\u250C\u2500\u29ED *Chat Debug Info*\n` +
            `\u251C\u25C6 Chat ID: ${chatId}\n` +
            `\u251C\u25C6 Sender: ${sender}\n` +
            `\u251C\u25C6 Is Group: ${isGroup}\n` +
            `\u251C\u25C6 Is Owner: ${isOwner}\n` +
            `\u251C\u25C6 Message Type: ${msgType}\n` +
            `\u251C\u25C6 Message ID: ${m.key.id}\n` +
            `\u251C\u25C6 From Me: ${m.key.fromMe}\n` +
            `\u251C\u25C6 Timestamp: ${m.messageTimestamp || 'N/A'}\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

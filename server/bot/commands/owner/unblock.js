export default {
    name: 'unblock',
    alias: [],
    description: 'Unblock a user',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        let targetJid = '';

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned && mentioned.length > 0) {
            targetJid = mentioned[0];
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            if (number) {
                targetJid = `${number}@s.whatsapp.net`;
            }
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Unblock User*\n\u251C\u25C6 Usage: ${PREFIX}unblock @user\n\u251C\u25C6 Or: ${PREFIX}unblock 254712345678\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        try {
            await sock.updateBlockStatus(targetJid, 'unblock');
            const display = targetJid.replace(/@.*/, '');
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *User Unblocked*\n\u251C\u25C6 Number: ${display}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Unblock Failed*\n\u251C\u25C6 Error: ${error.message}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};

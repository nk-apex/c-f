export default {
    name: 'blockdetect',
    alias: ['blocklist'],
    description: 'List all blocked contacts',
    category: 'owner',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        try {
            const blocklist = await sock.fetchBlocklist();

            if (!blocklist || blocklist.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `\u250C\u2500\u29ED *Block List*\n\u251C\u25C6 No blocked contacts\n\u2514\u2500\u29ED`
                }, { quoted: m });
                return;
            }

            let list = blocklist.map((jid, i) => `\u251C\u25C6 ${i + 1}. ${jid.replace(/@.*/, '')}`).join('\n');
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Block List*\n\u251C\u25C6 Total: ${blocklist.length}\n${list}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 ${error.message}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};

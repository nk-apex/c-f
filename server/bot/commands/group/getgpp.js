export default {
    name: 'getgpp',
    alias: ['grouppp', 'grouppic'],
    category: 'group',
    description: 'Get group profile picture',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const url = await sock.profilePictureUrl(jid, 'image');

            let caption = '┌─⧭ GROUP PROFILE PICTURE ⧭─┐\n';
            caption += '│ Here is the group profile picture.\n';
            caption += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, {
                image: { url },
                caption
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ NO PICTURE ⧭─┐\n│ This group has no profile picture set.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

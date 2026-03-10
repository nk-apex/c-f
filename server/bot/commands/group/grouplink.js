export default {
    name: 'grouplink',
    alias: ['glink', 'gclink'],
    category: 'group',
    description: 'Get group invite link',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n├◆ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        const metadata = await sock.groupMetadata(jid).catch(() => null);
        const participant = msg.key.participant || msg.key.remoteJid;
        const isAdmin = metadata?.participants?.find(p => p.id === participant)?.admin;

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '┌─⧭ ADMIN ONLY ⧭─┐\n├◆ Only group admins can get the invite link.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const code = await sock.groupInviteCode(jid);
            const link = `https://chat.whatsapp.com/${code}`;

            let text = '┌─⧭ GROUP INVITE LINK ⧭─┐\n';
            text += `├◆ Group: ${metadata?.subject || 'Unknown'}\n`;
            text += ``;
            text += `├◆ ${link}\n`;
            text += ``;
            text += `├◆ Share this link to invite others.\n`;
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to get invite link.\n├◆ Make sure the bot is an admin.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

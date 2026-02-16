export default {
    name: 'invite',
    alias: ['ginvite', 'groupinvite'],
    category: 'group',
    description: 'Generate and send group invite link',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        const metadata = await sock.groupMetadata(jid).catch(() => null);
        const participant = msg.key.participant || msg.key.remoteJid;
        const isAdmin = metadata?.participants?.find(p => p.id === participant)?.admin;

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '┌─⧭ ADMIN ONLY ⧭─┐\n│ Only group admins can generate invite links.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const code = await sock.groupInviteCode(jid);
            const link = `https://chat.whatsapp.com/${code}`;

            let text = '┌─⧭ GROUP INVITATION ⧭─┐\n';
            text += `│ You have been invited to join:\n`;
            text += `│ ${metadata?.subject || 'this group'}\n`;
            text += '│\n';
            text += `│ Click the link below to join:\n`;
            text += `│ ${link}\n`;
            text += '│\n';
            text += `│ Members: ${metadata?.participants?.length || 'N/A'}\n`;
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n│ Failed to generate invite link.\n│ Make sure the bot is an admin.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

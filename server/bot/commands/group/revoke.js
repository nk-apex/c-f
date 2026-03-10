export default {
    name: 'revoke',
    alias: ['revokelink', 'resetlink'],
    category: 'group',
    description: 'Revoke group invite link',
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
            return sock.sendMessage(jid, { text: '┌─⧭ ADMIN ONLY ⧭─┐\n├◆ Only group admins can revoke the invite link.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            await sock.groupRevokeInvite(jid);

            let text = '┌─⧭ LINK REVOKED ⧭─┐\n';
            text += '├◆ The old invite link has been revoked.\n';
            text += '├◆ A new link has been generated.\n';
            text += '\n';
            text += `├◆ Use ${PREFIX}grouplink to get the new link.\n`;
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to revoke invite link.\n├◆ Make sure the bot is an admin.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

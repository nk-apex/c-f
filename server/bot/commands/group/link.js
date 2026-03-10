export default {
    name: 'gclink',
    alias: ['getlink', 'sharelink'],
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
            await sock.sendMessage(jid, { text: `https://chat.whatsapp.com/${code}` }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to get invite link.\n├◆ Make sure the bot is an admin.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

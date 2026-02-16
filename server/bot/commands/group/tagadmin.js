export default {
    name: 'tagadmin',
    alias: ['mentionadmin', 'listadmin'],
    category: 'group',
    description: 'Tag all group admins',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

            if (admins.length === 0) {
                return sock.sendMessage(jid, { text: '┌─⧭ TAG ADMINS ⧭─┐\n│ No admins found in this group.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
            }

            let text = '┌─⧭ GROUP ADMINS ⧭─┐\n';
            text += `│ Group: ${metadata.subject}\n`;
            text += `│ Total Admins: ${admins.length}\n`;
            text += '│\n';

            admins.forEach((admin, i) => {
                const role = admin.admin === 'superadmin' ? 'Owner' : 'Admin';
                text += `│ ${i + 1}. @${admin.id.split('@')[0]} [${role}]\n`;
            });

            text += '│\n';
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, {
                text,
                mentions: admins.map(a => a.id)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n│ Failed to fetch admin list.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

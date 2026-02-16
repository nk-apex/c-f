export default {
    name: 'listonline',
    alias: ['whoonline', 'onlinelist'],
    category: 'group',
    description: 'List group member and admin count',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants || [];
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const members = participants.filter(p => !p.admin);

            let text = '┌─⧭ GROUP STATUS ⧭─┐\n';
            text += `│ Group: ${metadata.subject}\n`;
            text += '│\n';
            text += `│ Total Members: ${participants.length}\n`;
            text += `│ Admins: ${admins.length}\n`;
            text += `│ Regular Members: ${members.length}\n`;
            text += '│\n';
            text += '│ Note: Real-time online status\n';
            text += '│ detection is not available via\n';
            text += '│ the WhatsApp Web API.\n';
            text += '│\n';
            text += '│ Showing all participants:\n';

            const displayList = participants.slice(0, 30);
            displayList.forEach((p, i) => {
                const role = p.admin === 'superadmin' ? ' [Owner]' : p.admin === 'admin' ? ' [Admin]' : '';
                text += `│ ${i + 1}. @${p.id.split('@')[0]}${role}\n`;
            });

            if (participants.length > 30) {
                text += `│ ... and ${participants.length - 30} more\n`;
            }

            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, {
                text,
                mentions: displayList.map(p => p.id)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n│ Failed to fetch group info.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

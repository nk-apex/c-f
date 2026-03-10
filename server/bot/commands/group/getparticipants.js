export default {
    name: 'getparticipants',
    alias: ['members', 'memberlist', 'listmembers'],
    category: 'group',
    description: 'List all group members',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n├◆ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants || [];

            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const members = participants.filter(p => !p.admin);

            let text = '┌─⧭ GROUP MEMBERS ⧭─┐\n';
            text += `├◆ Group: ${metadata.subject}\n`;
            text += `├◆ Total: ${participants.length} members\n`;
            text += `├◆ Admins: ${admins.length} | Members: ${members.length}\n`;
            text += '\n';

            text += '├◆ -- Admins --\n';
            admins.forEach((p, i) => {
                const role = p.admin === 'superadmin' ? 'Owner' : 'Admin';
                text += `├◆ ${i + 1}. @${p.id.split('@')[0]} [${role}]\n`;
            });

            text += '├◆\n├◆ -- Members --\n';
            const displayMembers = members.slice(0, 50);
            displayMembers.forEach((p, i) => {
                text += `├◆ ${i + 1}. @${p.id.split('@')[0]}\n`;
            });

            if (members.length > 50) {
                text += `├◆ ... and ${members.length - 50} more members\n`;
            }

            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, {
                text,
                mentions: participants.map(p => p.id)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to fetch member list.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

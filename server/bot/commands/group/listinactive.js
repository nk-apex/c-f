export default {
    name: 'listinactive',
    alias: ['inactive', 'deadmembers'],
    category: 'group',
    description: 'List potentially inactive group members',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n├◆ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants || [];
            const nonAdmins = participants.filter(p => !p.admin);

            let text = '┌─⧭ POTENTIALLY INACTIVE ⧭─┐\n';
            text += `├◆ Group: ${metadata.subject}\n`;
            text += `├◆ Non-admin members: ${nonAdmins.length}\n`;
            text += '\n';
            text += '├◆ Note: Activity tracking is not\n';
            text += '├◆ available via the WhatsApp Web API.\n';
            text += '├◆ Listing all non-admin members as\n';
            text += '├◆ potentially inactive.\n';
            text += '\n';

            const displayList = nonAdmins.slice(0, 50);
            displayList.forEach((p, i) => {
                text += `├◆ ${i + 1}. @${p.id.split('@')[0]}\n`;
            });

            if (nonAdmins.length > 50) {
                text += `├◆ ... and ${nonAdmins.length - 50} more\n`;
            }

            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, {
                text,
                mentions: displayList.map(p => p.id)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to fetch member list.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

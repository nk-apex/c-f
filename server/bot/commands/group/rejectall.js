export default {
    name: 'rejectall',
    alias: ['denyall', 'declineall'],
    category: 'group',
    description: 'Reject all pending join requests',
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
            return sock.sendMessage(jid, { text: '┌─⧭ ADMIN ONLY ⧭─┐\n├◆ Only group admins can reject requests.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const response = await sock.groupRequestParticipantsList(jid);

            if (!response || response.length === 0) {
                return sock.sendMessage(jid, { text: '┌─⧭ NO REQUESTS ⧭─┐\n├◆ There are no pending join requests.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
            }

            let rejected = 0;
            let failed = 0;

            for (const req of response) {
                try {
                    await sock.groupRequestParticipantsUpdate(jid, [req.jid], 'reject');
                    rejected++;
                } catch {
                    failed++;
                }
            }

            let text = '┌─⧭ REJECT ALL ⧭─┐\n';
            text += `├◆ Total requests: ${response.length}\n`;
            text += `├◆ Rejected: ${rejected}\n`;
            if (failed > 0) text += `├◆ Failed: ${failed}\n`;
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to process join requests.\n├◆ Make sure the bot is an admin.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

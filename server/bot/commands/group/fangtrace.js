export default {
    name: 'fangtrace',
    alias: ['trace', 'lookup'],
    category: 'group',
    description: 'Look up a phone number on WhatsApp',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n├◆ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        if (!args[0]) {
            let text = '┌─⧭ FANG TRACE ⧭─┐\n';
            text += '│ Look up a phone number on WhatsApp.\n';
            text += '│\n';
            text += `│ Usage: ${PREFIX}fangtrace <number>\n`;
            text += `│ Example: ${PREFIX}fangtrace 2348012345678\n`;
            text += '│\n';
            text += '│ Use full number with country code.\n';
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        const number = args[0].replace(/[^0-9]/g, '');

        if (!number || number.length < 7) {
            return sock.sendMessage(jid, { text: '┌─⧭ INVALID NUMBER ⧭─┐\n├◆ Please provide a valid phone number\n├◆ with country code.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        try {
            const [result] = await sock.onWhatsApp(number + '@s.whatsapp.net');

            let text = '┌─⧭ FANG TRACE RESULT ⧭─┐\n';
            text += `│ Number: +${number}\n`;
            text += '│\n';

            if (result && result.exists) {
                text += '│ Status: Registered on WhatsApp\n';
                text += `│ JID: ${result.jid}\n`;
            } else {
                text += '│ Status: Not registered on WhatsApp\n';
            }

            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(jid, { text: '┌─⧭ ERROR ⧭─┐\n├◆ Failed to look up the number.\n├◆ Please try again later.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }
    }
};

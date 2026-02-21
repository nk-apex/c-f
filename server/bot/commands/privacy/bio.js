export default {
    name: 'bio',
    alias: ['setbio', 'setabout', 'mybio'],
    category: 'privacy',
    description: 'View or set your WhatsApp bio/about',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const react = async (emoji) => {
            try { await sock.sendMessage(chatId, { react: { text: emoji, key: m.key } }); } catch {}
        };

        try {
            if (args.length === 0) {
                await react("📋");
                let currentBio = 'Not available';
                try {
                    const me = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
                    const status = await sock.fetchStatus(me);
                    currentBio = status?.status || 'Not set';
                } catch {}

                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *BIO / ABOUT*\n├◆ Current: ${currentBio}\n├◆ Set: ${PREFIX}bio <your new bio>\n└─⧭`
                }, { quoted: m });
                return;
            }

            await react("🔄");

            const newBio = args.join(' ');
            try {
                await sock.updateProfileStatus(newBio);
            } catch {}

            await sock.sendMessage(chatId, {
                text: `┌─⧭ *BIO UPDATED*\n├◆ New bio: ${newBio}\n└─⧭`
            }, { quoted: m });

            await react("✅");
        } catch (error) {
            await react("❌");
        }
    }
};

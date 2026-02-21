export default {
    name: 'viewers',
    alias: ['statusview', 'statusvisibility', 'storyview'],
    category: 'privacy',
    description: 'Toggle who can see your WhatsApp statuses',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const react = async (emoji) => {
            try { await sock.sendMessage(chatId, { react: { text: emoji, key: m.key } }); } catch {}
        };

        try {
            await react("🔄");

            const option = args[0]?.toLowerCase();
            let newValue;

            if (option === 'all' || option === 'everyone') {
                newValue = 'all';
            } else if (option === 'contacts') {
                newValue = 'contacts';
            } else if (option === 'none' || option === 'nobody') {
                newValue = 'none';
            } else {
                let current = 'unknown';
                try {
                    const settings = await sock.fetchPrivacySettings(true);
                    current = settings?.status || settings?.statusPrivacy || 'all';
                } catch {}
                if (current === 'all') newValue = 'contacts';
                else if (current === 'contacts') newValue = 'none';
                else newValue = 'all';
            }

            try {
                await sock.updateStatusPrivacy(newValue);
            } catch {}

            const labels = { all: 'Everyone', contacts: 'My Contacts', none: 'Nobody' };

            await sock.sendMessage(chatId, {
                text: `┌─⧭ *STATUS VISIBILITY*\n├◆ Visible to: ${labels[newValue] || newValue}\n├◆ Use: ${PREFIX}viewers <all|contacts|none>\n└─⧭`
            }, { quoted: m });

            await react("✅");
        } catch (error) {
            await react("❌");
        }
    }
};

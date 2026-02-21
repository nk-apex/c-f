export default {
    name: 'receipt',
    alias: ['readreceipt', 'bluetick', 'blueTick'],
    category: 'privacy',
    description: 'Toggle read receipts on/off',
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

            if (option === 'on' || option === 'enable') {
                newValue = 'all';
            } else if (option === 'off' || option === 'disable') {
                newValue = 'none';
            } else {
                let current = 'unknown';
                try {
                    const settings = await sock.fetchPrivacySettings(true);
                    current = settings?.readreceipts || settings?.readReceiptsPrivacy || 'unknown';
                } catch {}
                newValue = (current === 'all') ? 'none' : 'all';
            }

            try {
                await sock.updateReadReceiptsPrivacy(newValue);
            } catch {}

            const isOn = newValue === 'all';
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *READ RECEIPTS*\n├◆ Status: ${isOn ? 'ON ✅' : 'OFF ❌'}\n├◆ Blue ticks: ${isOn ? 'Visible to others' : 'Hidden from others'}\n└─⧭`
            }, { quoted: m });

            await react(isOn ? "✅" : "❌");
        } catch (error) {
            await react("❌");
        }
    }
};

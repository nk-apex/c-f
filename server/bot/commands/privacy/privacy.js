export default {
    name: 'privacy',
    alias: ['privacysettings', 'privacyinfo'],
    category: 'privacy',
    description: 'View all WhatsApp privacy settings',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const react = async (emoji) => {
            try { await sock.sendMessage(chatId, { react: { text: emoji, key: m.key } }); } catch {}
        };

        try {
            await react("🔒");

            let statusPrivacy = 'unknown';
            let profilePhotoPrivacy = 'unknown';
            let lastSeenPrivacy = 'unknown';
            let onlinePrivacy = 'unknown';
            let readReceiptsPrivacy = 'unknown';
            let groupAddPrivacy = 'unknown';

            try {
                const status = await sock.fetchPrivacySettings(true);
                if (status) {
                    statusPrivacy = status.status || status.statusPrivacy || 'unknown';
                    profilePhotoPrivacy = status.profile || status.profilePicturePrivacy || 'unknown';
                    lastSeenPrivacy = status.last || status.lastSeenPrivacy || 'unknown';
                    onlinePrivacy = status.online || status.onlinePrivacy || 'unknown';
                    readReceiptsPrivacy = status.readreceipts || status.readReceiptsPrivacy || 'unknown';
                    groupAddPrivacy = status.groupadd || status.groupAddPrivacy || 'unknown';
                }
            } catch {}

            const text = `┌─⧭ *PRIVACY SETTINGS* ⧭─┐\n` +
                `│\n` +
                `├◆ Last Seen: ${lastSeenPrivacy}\n` +
                `├◆ Profile Photo: ${profilePhotoPrivacy}\n` +
                `├◆ About/Status: ${statusPrivacy}\n` +
                `├◆ Online: ${onlinePrivacy}\n` +
                `├◆ Read Receipts: ${readReceiptsPrivacy}\n` +
                `├◆ Group Add: ${groupAddPrivacy}\n` +
                `│\n` +
                `├◆ ⧭ *COMMANDS*\n` +
                `├◆ ${PREFIX}receipt - Toggle read receipts\n` +
                `├◆ ${PREFIX}profilepic - Toggle profile pic visibility\n` +
                `├◆ ${PREFIX}viewers - Toggle status visibility\n` +
                `├◆ ${PREFIX}bio - View/set bio\n` +
                `├◆ ${PREFIX}autobio - Toggle auto bio\n` +
                `└─⧭`;

            await sock.sendMessage(chatId, { text }, { quoted: m });
            await react("✅");
        } catch (error) {
            await react("❌");
        }
    }
};

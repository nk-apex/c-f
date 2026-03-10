export default {
    name: 'lastseen',
    alias: ['setlastseen', 'lastseenprivacy', 'lsprivacy'],
    category: 'owner',
    description: 'Control who can see your last seen on WhatsApp',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        const isSudoUser = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudoUser) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*'
            }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();

        try {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

            if (action === 'everyone' || action === 'all') {
                await sock.updateLastSeenPrivacy('all');
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🕓 *LAST SEEN PRIVACY* \n├◆ Usage: *${PREFIX}lastseen <text>*\n├◆ Control who can see your last seen on WhatsApp\n├◆ Aliases: *${PREFIX}setlastseen*, *${PREFIX}lastseenprivacy*, *${PREFIX}lsprivacy*\n└─⧭`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🌍', key: msg.key } }); } catch {}

            } else if (action === 'contacts') {
                await sock.updateLastSeenPrivacy('contacts');
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🕓 *LAST SEEN PRIVACY* \n├◆ Usage: *${PREFIX}lastseen <text>*\n├◆ Control who can see your last seen on WhatsApp\n├◆ Aliases: *${PREFIX}setlastseen*, *${PREFIX}lastseenprivacy*, *${PREFIX}lsprivacy*\n└─⧭`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '👥', key: msg.key } }); } catch {}

            } else if (action === 'except') {
                await sock.updateLastSeenPrivacy('contact_blacklist');
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🕓 *LAST SEEN PRIVACY* \n├◆ Usage: *${PREFIX}lastseen <text>*\n├◆ Control who can see your last seen on WhatsApp\n├◆ Aliases: *${PREFIX}setlastseen*, *${PREFIX}lastseenprivacy*, *${PREFIX}lsprivacy*\n└─⧭`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🚫', key: msg.key } }); } catch {}

            } else if (action === 'none' || action === 'nobody' || action === 'hide' || action === 'off') {
                await sock.updateLastSeenPrivacy('none');
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🕓 *LAST SEEN PRIVACY* \n├◆ Usage: *${PREFIX}lastseen <text>*\n├◆ Control who can see your last seen on WhatsApp\n├◆ Aliases: *${PREFIX}setlastseen*, *${PREFIX}lastseenprivacy*, *${PREFIX}lsprivacy*\n└─⧭`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '🔒', key: msg.key } }); } catch {}

            } else {
                let currentStatus = 'Unknown';
                try {
                    const privacy = await sock.fetchPrivacySettings(true);
                    const ls = privacy.last || privacy.lastSeen;
                    if (ls === 'all') currentStatus = '🌍 Everyone';
                    else if (ls === 'contacts') currentStatus = '👥 Contacts Only';
                    else if (ls === 'contact_blacklist') currentStatus = '🚫 Contacts Except...';
                    else if (ls === 'none') currentStatus = '🔒 Nobody';
                    else currentStatus = ls || 'Unknown';
                } catch {}

                await sock.sendMessage(chatId, {
                    text: `┌─⧭ 🕓 *LAST SEEN PRIVACY* \n` +
                          `├◆ *Current:* ${currentStatus}\n` +
                          `├◆  ⚙️ *OPTIONS* \n` +
                          `├◆ *${PREFIX}lastseen everyone*\n` +
                          `├◆ *${PREFIX}lastseen contacts*\n` +
                          `├◆ *${PREFIX}lastseen except*\n` +
                          `├◆ *${PREFIX}lastseen nobody*\n` +
                          `└─⧭`
                }, { quoted: msg });
                try { await sock.sendMessage(chatId, { react: { text: '📋', key: msg.key } }); } catch {}
            }

        } catch (error) {
            console.error('[LastSeen] Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to update last seen privacy*\n\n${error.message}`
            }, { quoted: msg });
            try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
        }
    }
};

import db from '../../lib/supabase.js';
import { applyFont, AVAILABLE_FONTS } from '../../lib/fontTransformer.js';

export default {
    name: 'setfont',
    alias: ['font', 'botfont', 'changefont', 'fontmode'],
    category: 'owner',
    description: 'Set the global font style for all bot responses',
    ownerOnly: true,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;

        const isSudo = extra?.isSudo ? extra.isSudo() : false;
        if (!jidManager.isOwner(msg) && !isSudo) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner Only Command*\n\nOnly the owner or sudo users can change the bot font.'
            }, { quoted: msg });
        }

        const currentFont = (globalThis._fontConfig && globalThis._fontConfig.font) || 'default';

        // No argument → show font menu
        if (!args[0]) {
            const fontLines = Object.entries(AVAILABLE_FONTS).map(([key, info]) => {
                const active = key === currentFont ? ' ✅ active' : '';
                return `├◆ ├ *${key}*${active}\n├◆ ├◆   ${info.example}`;
            }).join('\n├◆ ├◆\n');

            const defaultActive = currentFont === 'default' ? ' ✅ active' : '';

            return sock.sendMessage(chatId, {
                text: [
                    `┌─⧭ 🎨 *SET BOT FONT* `,
                    `├◆`,
                    `├◆ 📝 Current: *${currentFont}*`,
                    `├◆`,
                    `├◆ ─── Available Fonts ───`,
                    `├◆`,
                    fontLines,
                    `├◆ ├◆`,
                    `├◆ ├ *default*${defaultActive}`,
                    `├◆ ├◆   Normal text (no style)`,
                    `├◆`,
                    `├◆ *${PREFIX}setfont <name>*`,
                    `├◆`,
                    `├◆ *${PREFIX}setfont default*`,
                    `├◆`,
                    `└─⧭`
                ].join('\n')
            }, { quoted: msg });
        }

        const input = args[0].toLowerCase().trim();
        const resetAliases = ['default', 'reset', 'none', 'normal', 'off', 'clear'];

        // Reset to default
        if (resetAliases.includes(input)) {
            globalThis._fontConfig = { font: 'default' };
            await db.setConfig('font_config', { font: 'default' });

            return sock.sendMessage(chatId, {
                text: `✅ *Font Reset to Default*\n\nAll bot responses will now appear in normal text.`
            }, { quoted: msg });
        }

        // Unknown font
        if (!AVAILABLE_FONTS[input]) {
            const validList = [...Object.keys(AVAILABLE_FONTS), 'default'].join(', ');
            return sock.sendMessage(chatId, {
                text: `❌ *Unknown Font: "${args[0]}"*\n\nAvailable fonts: ${validList}\n\nExample: *${PREFIX}setfont gothic*`
            }, { quoted: msg });
        }

        // Apply the new font
        globalThis._fontConfig = { font: input };
        await db.setConfig('font_config', { font: input });

        const info = AVAILABLE_FONTS[input];

        // Reply in the new font so the user sees it immediately
        const replyText = [
            `✅ Font Updated: ${info.name}`,
            ``,
            `Description: ${info.description}`,
            ``,
            `Preview: ${info.example}`,
            ``,
            `All bot responses now use ${info.name} style.`,
            `Use ${PREFIX}setfont default to reset.`
        ].join('\n');

        await sock.sendMessage(chatId, {
            text: applyFont(replyText, input)
        }, { quoted: msg });
    }
};

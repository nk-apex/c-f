import { createRequire } from 'module';
import { isButtonModeEnabled } from '../../lib/buttonMode.js';

const _requireAl = createRequire(import.meta.url);
let giftedBtnsAl;
try { giftedBtnsAl = _requireAl('gifted-btns'); } catch (e) {}

const URL_PATTERNS = [
    /https?:\/\/[^\s<>]+/gi,
    /www\.[^\s<>]+\.[a-zA-Z]{2,}/gi,
    /t\.me\/[^\s<>]+/gi,
    /instagram\.com\/[^\s<>]+/gi,
    /facebook\.com\/[^\s<>]+/gi,
    /fb\.com\/[^\s<>]+/gi,
    /twitter\.com\/[^\s<>]+/gi,
    /x\.com\/[^\s<>]+/gi,
    /youtube\.com\/[^\s<>]+/gi,
    /youtu\.be\/[^\s<>]+/gi,
    /whatsapp\.com\/[^\s<>]+/gi,
    /chat\.whatsapp\.com\/[^\s<>]+/gi,
    /discord\.gg\/[^\s<>]+/gi,
    /discord\.com\/[^\s<>]+/gi,
    /snapchat\.com\/[^\s<>]+/gi,
    /tiktok\.com\/[^\s<>]+/gi,
    /reddit\.com\/[^\s<>]+/gi,
    /linkedin\.com\/[^\s<>]+/gi,
    /github\.com\/[^\s<>]+/gi,
    /bit\.ly\/[^\s<>]+/gi,
    /tinyurl\.com\/[^\s<>]+/gi,
    /goo\.gl\/[^\s<>]+/gi,
    /ow\.ly\/[^\s<>]+/gi,
    /is\.gd\/[^\s<>]+/gi,
    /v\.gd\/[^\s<>]+/gi,
    /cutt\.ly\/[^\s<>]+/gi,
    /shorturl\.at\/[^\s<>]+/gi,
    /wa\.me\/[^\s<>]+/gi,
    /vm\.tiktok\.com\/[^\s<>]+/gi,
    /pin\.it\/[^\s<>]+/gi,
    /open\.spotify\.com\/[^\s<>]+/gi,
    /spotify\.link\/[^\s<>]+/gi,
];

const BARE_DOMAIN_PATTERN = /\b[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net|org|io|co|me|info|biz|xyz|dev|app|gg|tv|cc|ly|to|link|shop|store|site|online|live|club|pro|tech|space|fun|one|world|top|click|buzz|win|website)\b/gi;

function extractMessageText(message) {
    if (!message) return '';

    const parts = [];

    if (message.conversation) parts.push(message.conversation);
    if (message.extendedTextMessage?.text) parts.push(message.extendedTextMessage.text);
    if (message.imageMessage?.caption) parts.push(message.imageMessage.caption);
    if (message.videoMessage?.caption) parts.push(message.videoMessage.caption);
    if (message.documentMessage?.caption) parts.push(message.documentMessage.caption);
    if (message.documentMessage?.fileName) parts.push(message.documentMessage.fileName);
    if (message.contactMessage?.displayName) parts.push(message.contactMessage.displayName);
    if (message.contactMessage?.vcard) parts.push(message.contactMessage.vcard);
    if (message.listMessage?.title) parts.push(message.listMessage.title);
    if (message.listMessage?.description) parts.push(message.listMessage.description);
    if (message.buttonsMessage?.contentText) parts.push(message.buttonsMessage.contentText);
    if (message.buttonsMessage?.headerText) parts.push(message.buttonsMessage.headerText);
    if (message.templateMessage?.hydratedTemplate?.hydratedContentText) {
        parts.push(message.templateMessage.hydratedTemplate.hydratedContentText);
    }
    if (message.pollCreationMessage?.name) parts.push(message.pollCreationMessage.name);

    if (message.contactsArrayMessage?.contacts) {
        for (const c of message.contactsArrayMessage.contacts) {
            if (c.displayName) parts.push(c.displayName);
            if (c.vcard) parts.push(c.vcard);
        }
    }

    if (message.extendedTextMessage?.matchedText) {
        parts.push(message.extendedTextMessage.matchedText);
    }

    if (message.extendedTextMessage?.canonicalUrl) {
        parts.push(message.extendedTextMessage.canonicalUrl);
    }

    return parts.join(' ');
}

function containsLink(text) {
    if (!text || typeof text !== 'string') return false;

    const cleanText = text.replace(/[*_~`|]/g, '');

    for (const pattern of URL_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(cleanText)) return true;
    }

    BARE_DOMAIN_PATTERN.lastIndex = 0;
    if (BARE_DOMAIN_PATTERN.test(cleanText)) return true;

    return false;
}

function extractLinks(text) {
    if (!text || typeof text !== 'string') return [];

    const links = new Set();
    const cleanText = text.replace(/[*_~`|]/g, '');

    for (const pattern of URL_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = cleanText.match(pattern);
        if (matches) {
            for (let link of matches) {
                link = link.trim().replace(/[.,;:!?]+$/, '');
                if (link.startsWith('www.') && !link.startsWith('https://')) {
                    link = 'https://' + link;
                }
                links.add(link);
            }
        }
    }

    BARE_DOMAIN_PATTERN.lastIndex = 0;
    const bareMatches = cleanText.match(BARE_DOMAIN_PATTERN);
    if (bareMatches) {
        for (const m of bareMatches) {
            links.add(m.trim());
        }
    }

    return [...links];
}

function cleanJid(jid) {
    if (!jid) return jid;
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

function loadConfig() {
    if (typeof globalThis._antilinkConfig === 'object' && globalThis._antilinkConfig !== null) {
        return globalThis._antilinkConfig;
    }
    return {};
}

function saveConfig(data) {
    globalThis._antilinkConfig = data;
    if (typeof globalThis._saveAntilinkConfig === 'function') {
        globalThis._saveAntilinkConfig(data);
    }
}

function isEnabled(chatJid) {
    const config = loadConfig();
    return config[chatJid]?.enabled || false;
}

function getMode(chatJid) {
    const config = loadConfig();
    return config[chatJid]?.mode || 'delete';
}

function getGroupConfig(chatJid) {
    const config = loadConfig();
    return config[chatJid] || null;
}

function checkMessageForLinks(msg) {
    if (!msg.message) return { hasLink: false, links: [], text: '' };
    const text = extractMessageText(msg.message);
    const hasLink = containsLink(text);
    const links = hasLink ? extractLinks(text) : [];
    return { hasLink, links, text };
}

function isLinkExempt(links, exemptLinks) {
    if (!exemptLinks || exemptLinks.length === 0) return false;
    return links.some(link => {
        const cleanLink = link.replace(/^https?:\/\//, '').toLowerCase();
        return exemptLinks.some(exempt => cleanLink.includes(exempt) || exempt.includes(cleanLink));
    });
}

export default {
    name: 'antilink',
    description: 'Control link sharing in the group with different actions',
    category: 'group',

    checkMessageForLinks,
    isEnabled,
    getMode,
    getGroupConfig,
    isLinkExempt,
    containsLink,
    extractLinks,
    extractMessageText,

    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: '❌ This command can only be used in groups.'
            }, { quoted: msg });
        }

        let sender = msg.key.participant || (msg.key.fromMe ? sock.user.id : chatId);
        sender = cleanJid(sender);

        let isAdmin = false;
        let botIsAdmin = false;

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const cleanSender = cleanJid(sender);

            const participant = groupMetadata.participants.find(p => cleanJid(p.id) === cleanSender);
            isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

            const botJid = cleanJid(sock.user?.id);
            const botParticipant = groupMetadata.participants.find(p => cleanJid(p.id) === botJid);
            botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
        } catch {
            return sock.sendMessage(chatId, {
                text: '❌ Failed to fetch group information.'
            }, { quoted: msg });
        }

        const isOwner = extra?.isOwner ? extra.isOwner() : false;
        const isSudo = extra?.isSudo ? extra.isSudo() : false;

        if (!isAdmin && !isOwner && !isSudo) {
            return sock.sendMessage(chatId, {
                text: '❌ Only group admins can use this command!'
            }, { quoted: msg });
        }

        const config = loadConfig();
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on') {
            const mode = (args[1] || '').toLowerCase();
            if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ ⚙️ *ANTI-LINK SETUP* \n├◆ Usage: *${PREFIX}antilink <text>*\n├◆ Control link sharing in the group with different actions\n└─⧭`
                }, { quoted: msg });
            }

            if (!botIsAdmin && (mode === 'delete' || mode === 'kick')) {
                await sock.sendMessage(chatId, {
                    text: '⚠️ I need admin permissions for delete/kick modes to work!'
                }, { quoted: msg });
            }

            config[chatId] = {
                enabled: true,
                mode,
                exemptAdmins: config[chatId]?.exemptAdmins ?? true,
                exemptLinks: config[chatId]?.exemptLinks || [],
                warningCount: config[chatId]?.warningCount || {}
            };
            saveConfig(config);

            return sock.sendMessage(chatId, {
                text: `┌─⧭ 🔗 *ANTI-LINK ENABLED* \n├◆ Usage: *${PREFIX}antilink <text>*\n├◆ Control link sharing in the group with different actions\n└─⧭`
            }, { quoted: msg });
        }

        if (sub === 'off') {
            if (config[chatId]) {
                config[chatId].enabled = false;
                saveConfig(config);
            }
            return sock.sendMessage(chatId, {
                text: '❌ *Anti-link disabled!*\n\nEveryone can now share links in this group.'
            }, { quoted: msg });
        }

        if (sub === 'status') {
            const gc = config[chatId];
            if (gc?.enabled) {
                let statusText = `┌─⧭ 🔗 *ANTI-LINK STATUS* \n`;
                statusText += `├◆ *Status:* ✅ ENABLED\n`;
                statusText += `├◆ *Mode:* ${gc.mode.toUpperCase()}\n`;
                statusText += `├◆ *Bot admin:* ${botIsAdmin ? '✅' : '❌'}\n`;
                statusText += `├◆ *Admins exempt:* ${gc.exemptAdmins ? 'Yes' : 'No'}\n`;
                statusText += `├◆ *Allowed links:* ${gc.exemptLinks?.length || 0}\n`;
                statusText += `├◆ *Detection:* All message types\n`;
                statusText += `└─⧭`;
                return sock.sendMessage(chatId, { text: statusText }, { quoted: msg });
            }
            return sock.sendMessage(chatId, {
                text: `┌─⧭ 🔗 *ANTI-LINK STATUS* \n├◆ *Status:* ❌ DISABLED\n├◆ Enable: *${PREFIX}antilink on [mode]*\n└─⧭`
            }, { quoted: msg });
        }

        if (sub === 'allow') {
            const linkToAllow = args.slice(1).join(' ').trim();
            if (!linkToAllow) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ 🔗 *ALLOW LINK* \n├◆ Usage: *${PREFIX}antilink <text>*\n├◆ Control link sharing in the group with different actions\n└─⧭`
                }, { quoted: msg });
            }

            if (!config[chatId]) config[chatId] = { enabled: false, mode: 'delete', exemptAdmins: true, exemptLinks: [], warningCount: {} };
            if (!config[chatId].exemptLinks) config[chatId].exemptLinks = [];

            const cleanLink = linkToAllow.replace(/^https?:\/\//, '').toLowerCase();
            if (config[chatId].exemptLinks.includes(cleanLink)) {
                return sock.sendMessage(chatId, { text: `✅ Already allowed: \`${cleanLink}\`` }, { quoted: msg });
            }

            config[chatId].exemptLinks.push(cleanLink);
            saveConfig(config);
            return sock.sendMessage(chatId, {
                text: `✅ Link allowed: \`${cleanLink}\`\n\nThis link can now be shared freely.`
            }, { quoted: msg });
        }

        if (sub === 'disallow' || sub === 'remove') {
            const linkToRemove = args.slice(1).join(' ').trim();
            if (!linkToRemove) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ 🔗 *DISALLOW LINK* \n├◆ *${PREFIX}antilink disallow [link]*\n└─⧭`
                }, { quoted: msg });
            }

            if (!config[chatId]?.exemptLinks?.length) {
                return sock.sendMessage(chatId, { text: '❌ No allowed links to remove.' }, { quoted: msg });
            }

            const cleanLink = linkToRemove.replace(/^https?:\/\//, '').toLowerCase();
            const idx = config[chatId].exemptLinks.indexOf(cleanLink);
            if (idx === -1) {
                return sock.sendMessage(chatId, { text: `❌ Link not in allowed list: \`${cleanLink}\`` }, { quoted: msg });
            }

            config[chatId].exemptLinks.splice(idx, 1);
            saveConfig(config);
            return sock.sendMessage(chatId, { text: `✅ Link removed from allowed list: \`${cleanLink}\`` }, { quoted: msg });
        }

        if (sub === 'listallowed' || sub === 'list') {
            const exemptLinks = config[chatId]?.exemptLinks || [];
            if (exemptLinks.length === 0) {
                return sock.sendMessage(chatId, { text: '📋 *Allowed Links*\n\nNo links are currently allowed.' }, { quoted: msg });
            }
            let listText = '📋 *Allowed Links*\n\n';
            exemptLinks.forEach((link, i) => { listText += `${i + 1}. \`${link}\`\n`; });
            listText += `\nTotal: ${exemptLinks.length}`;
            return sock.sendMessage(chatId, { text: listText }, { quoted: msg });
        }

        if (sub === 'exemptadmins') {
            const toggle = (args[1] || '').toLowerCase();
            if (!config[chatId]) config[chatId] = { enabled: false, mode: 'delete', exemptAdmins: true, exemptLinks: [], warningCount: {} };
            if (toggle === 'on') {
                config[chatId].exemptAdmins = true;
                saveConfig(config);
                return sock.sendMessage(chatId, { text: '⚙️ *Admin exemption enabled* — Admins can share links freely.' }, { quoted: msg });
            }
            if (toggle === 'off') {
                config[chatId].exemptAdmins = false;
                saveConfig(config);
                return sock.sendMessage(chatId, { text: '⚙️ *Admin exemption disabled* — Admins are subject to anti-link rules.' }, { quoted: msg });
            }
            const current = config[chatId].exemptAdmins !== false ? 'enabled' : 'disabled';
            return sock.sendMessage(chatId, {
                text: `⚙️ *Admin Exemption:* ${current}\n\nUse: *${PREFIX}antilink exemptadmins on/off*`
            }, { quoted: msg });
        }

        if (sub === 'test') {
            const testText = args.slice(1).join(' ') || 'Test message with https://example.com and youtube.com/watch?v=abc';
            const hasLink = containsLink(testText);
            const extracted = extractLinks(testText);

            let result = `🔍 *Link Detection Test*\n\n`;
            result += `Text: ${testText}\n\n`;
            result += `Contains link: ${hasLink ? '✅ Yes' : '❌ No'}\n`;
            if (hasLink && extracted.length > 0) {
                result += `\nExtracted links:\n`;
                extracted.forEach((link, i) => { result += `${i + 1}. \`${link}\`\n`; });
            }

            return sock.sendMessage(chatId, { text: result }, { quoted: msg });
        }

        const gc = config[chatId];
        const currentStatus = gc?.enabled ? `✅ ${gc.mode.toUpperCase()}` : '❌ OFF';
        const helpText = `┌─⧭ 🔗 *ANTI-LINK* \n├◆ Usage: *${PREFIX}antilink <text>*\n├◆ Control link sharing in the group with different actions\n└─⧭`;
        if (isButtonModeEnabled() && giftedBtnsAl?.sendInteractiveMessage) {
            try {
                await giftedBtnsAl.sendInteractiveMessage(sock, chatId, {
                    body: { text: helpText },
                    footer: { text: `Status: ${currentStatus}` },
                    interactiveButtons: [
                        { type: 'quick_reply', display_text: '⚠️ Warn Mode', id: `${PREFIX}antilink on warn` },
                        { type: 'quick_reply', display_text: '🗑️ Delete Mode', id: `${PREFIX}antilink on delete` },
                        { type: 'quick_reply', display_text: '👢 Kick Mode', id: `${PREFIX}antilink on kick` }
                    ]
                }, { quoted: msg });
                return;
            } catch (e) {}
        }
        return sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
    }
};

export { checkMessageForLinks, isEnabled, getMode, getGroupConfig, isLinkExempt, containsLink, extractLinks, extractMessageText };

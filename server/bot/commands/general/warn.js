// commands/group/warn.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: "warn",
    alias: ["warning", "warnuser"],
    description: "Warn users in group ⚠️",
    category: "group",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!foxCanUse(m, 'warn')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(jid, { text: message });
            return;
        }
        
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: "❌ This command only works in groups! 👥"
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(jid).catch(() => null);
        const participant = m.key.participant || jid;
        const isAdmin = metadata?.participants?.find(p => p.id === participant)?.admin;
        
        if (!isAdmin && !foxOwners.isOwner(m)) {
            return sock.sendMessage(jid, {
                text: "❌ Only group admins can warn users! 👑"
            }, { quoted: m });
        }
        
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0) {
            return sock.sendMessage(jid, {
                text: `⚠️ *WARN USER* 🦊\n\n` +
                      `Warn users for rule violations.\n\n` +
                      `*Usage:*\n` +
                      `${PREFIX}warn @user\n` +
                      `${PREFIX}warn @user spamming\n` +
                      `${PREFIX}warn @user 3 (adds 3 warnings)\n\n` +
                      `*Check warnings:*\n` +
                      `${PREFIX}warn list - Show all warnings\n` +
                      `${PREFIX}warn check @user - Check user warnings\n\n` +
                      `*Remove warnings:*\n` +
                      `${PREFIX}unwarn @user - Remove 1 warning\n` +
                      `${PREFIX}unwarn @user all - Remove all warnings\n\n` +
                      `✨ *3 warnings = automatic kick!*`
            }, { quoted: m });
        }
        
        try {
            const targetId = mentioned[0];
            const targetNumber = targetId.split('@')[0];
            const reason = args.slice(mentioned.length).join(' ') || 'No reason specified';
            const warnCount = parseInt(args[mentioned.length]) || 1;
            
            // Check if target is admin
            const targetIsAdmin = metadata?.participants?.find(p => p.id === targetId)?.admin;
            if (targetIsAdmin) {
                return sock.sendMessage(jid, {
                    text: "❌ Cannot warn admins! They're above warnings! 👑"
                }, { quoted: m });
            }
            
            // Check if warning self
            if (targetId === participant) {
                return sock.sendMessage(jid, {
                    text: "🤔 You can't warn yourself! That's silly! 😅"
                }, { quoted: m });
            }
            
            // Load existing warnings
            let warnings = {};
            try {
                const warningsData = fs.readFileSync('./data/warnings.json', 'utf8');
                warnings = JSON.parse(warningsData);
            } catch {
                warnings = {};
            }
            
            if (!warnings[jid]) warnings[jid] = {};
            if (!warnings[jid][targetId]) warnings[jid][targetId] = { count: 0, reasons: [] };
            
            // Add warnings
            warnings[jid][targetId].count += warnCount;
            warnings[jid][targetId].reasons.push({
                reason: reason,
                warnedBy: m.pushName || 'Admin',
                warnedAt: new Date().toISOString(),
                count: warnCount
            });
            
            // Save warnings
            fs.writeFileSync('./data/warnings.json', JSON.stringify(warnings, null, 2));
            
            const totalWarnings = warnings[jid][targetId].count;
            const warningsLeft = Math.max(0, 3 - totalWarnings);
            
            // Create warning message
            let warningMsg = `⚠️ *USER WARNED!* 🦊\n\n`;
            warningMsg += `*User:* @${targetNumber}\n`;
            warningMsg += `*Warned by:* ${m.pushName || 'Admin'}\n`;
            warningMsg += `*Reason:* ${reason}\n`;
            warningMsg += `*Warnings added:* ${warnCount}\n`;
            warningMsg += `*Total warnings:* ${totalWarnings}/3\n\n`;
            
            if (totalWarnings >= 3) {
                warningMsg += `🚨 *MAX WARNINGS REACHED!*\n`;
                warningMsg += `User will be kicked automatically!\n\n`;
                
                // Auto-kick if 3+ warnings
                setTimeout(async () => {
                    try {
                        await sock.groupParticipantsUpdate(jid, [targetId], 'remove');
                        await sock.sendMessage(jid, {
                            text: `🚪 *USER KICKED!* 🦊\n\n@${targetNumber} was kicked for reaching 3 warnings!\n\nReason: ${reason}`,
                            mentions: [targetId]
                        });
                    } catch (kickError) {
                        console.error("Auto-kick failed:", kickError);
                    }
                }, 3000);
            } else {
                warningMsg += `⚠️ *WARNING LEVEL:* ${totalWarnings}/3\n`;
                warningMsg += `⚠️ *WARNINGS LEFT:* ${warningsLeft} until kick\n\n`;
                warningMsg += `📝 *Note:* 3 warnings = automatic kick!\n`;
            }
            
            warningMsg += `✨ *Follow group rules to avoid warnings!*`;
            
            await sock.sendMessage(jid, {
                text: warningMsg,
                mentions: [targetId]
            }, { quoted: m });
            
        } catch (error) {
            console.error("Warn error:", error);
            
            await sock.sendMessage(jid, {
                text: `❌ *WARN FAILED!* ⚠️\n\n` +
                      `Error: ${error.message || 'Unknown'}\n\n` +
                      `*Make sure:*\n` +
                      `• You're admin\n` +
                      `• User is in group\n` +
                      `• Bot is admin\n\n` +
                      `✨ *Fox needs admin rights to warn!*`
            }, { quoted: m });
        }
    }
};
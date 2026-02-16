// commands/group/welcome.js
import foxGroup from '../../utils/foxGroup.js';
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: 'welcome',
    alias: ['welcomemsg', 'greet', 'welcomeon'],
    category: 'group',
    description: 'Set welcome message for new members',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'welcome')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(chatId, { text: message });
            return;
        }
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: `❌ *GROUP ONLY* 🦊\n\n` +
                      `This command works in groups only!\n\n` +
                      `🦊 Add me to a group first!`
            });
            return;
        }
        
        const metadata = await sock.groupMetadata(chatId).catch(() => null);
        const participant = msg.key.participant || msg.key.remoteJid;
        const isAdmin = metadata?.participants?.find(p => p.id === participant)?.admin;
        
        if (!isAdmin && !foxOwners.isOwner(msg)) {
            await sock.sendMessage(chatId, {
                text: `❌ *ADMIN ONLY* 🦊\n\n` +
                      `Only group admins can set welcome message!\n\n` +
                      `🦊 Ask an admin to customize welcome!`
            });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        
        if (!action || !['on', 'off', 'set', 'status'].includes(action)) {
            const current = foxGroup.getGroup(chatId).welcome;
            const message = foxGroup.getWelcomeMessage(chatId);
            
            await sock.sendMessage(chatId, {
                text: `🎉 *WELCOME SYSTEM* 🦊\n\n` +
                      `*Current Status:* ${current ? '✅ ON' : '❌ OFF'}\n` +
                      `*Current Message:*\n"${message}"\n\n` +
                      `*Usage:*\n` +
                      `${prefix}welcome on - Enable welcome\n` +
                      `${prefix}welcome off - Disable welcome\n` +
                      `${prefix}welcome set <message> - Set custom message\n` +
                      `${prefix}welcome status - Check settings\n\n` +
                      `*Variables you can use:*\n` +
                      `• {user} - New member's name\n` +
                      `• {group} - Group name\n` +
                      `• {members} - Total members count\n\n` +
                      `*Example:*\n` +
                      `${prefix}welcome set Welcome {user} to {group}! 🦊\n\n` +
                      `🦊 Make newcomers feel welcome!`
            });
            return;
        }
        
        if (action === 'status') {
            const current = foxGroup.getGroup(chatId).welcome;
            const message = foxGroup.getWelcomeMessage(chatId);
            
            await sock.sendMessage(chatId, {
                text: `🔍 *WELCOME STATUS* 🦊\n\n` +
                      `*Enabled:* ${current ? '✅ YES' : '❌ NO'}\n` +
                      `*Group:* ${metadata?.subject || 'Unknown'}\n` +
                      `*Message:*\n"${message}"\n\n` +
                      `*Change:* ${prefix}welcome <on/off/set>\n\n` +
                      `🦊 ${current ? 'Welcoming new members!' : 'Welcome messages off!'}`
            });
            return;
        }
        
        if (action === 'on' || action === 'off') {
            const newStatus = action === 'on';
            foxGroup.setWelcome(chatId, newStatus);
            
            await sock.sendMessage(chatId, {
                text: `✅ *WELCOME ${newStatus ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
                      `*Status:* ${newStatus ? '✅ ACTIVE' : '❌ INACTIVE'}\n` +
                      `*Changed by:* ${msg.pushName || 'Admin'}\n` +
                      `*Group:* ${metadata?.subject || 'Unknown'}\n\n` +
                      `💡 *${newStatus ? 'New members will be welcomed!' : 'No welcome messages will be sent!'}*\n\n` +
                      `🦊 ${newStatus ? 'Ready to greet newcomers!' : 'Welcome messages turned off!'}`
            });
            return;
        }
        
        if (action === 'set') {
            const newMessage = args.slice(1).join(' ');
            
            if (!newMessage) {
                await sock.sendMessage(chatId, {
                    text: `❌ *NO MESSAGE* 🦊\n\n` +
                          `Please provide a welcome message!\n\n` +
                          `*Example:*\n` +
                          `${prefix}welcome set Welcome {user} to {group}! 🎉\n\n` +
                          `🦊 Make it welcoming!`
                });
                return;
            }
            
            foxGroup.setWelcomeMessage(chatId, newMessage);
            
            await sock.sendMessage(chatId, {
                text: `✅ *WELCOME MESSAGE SET!* 🦊\n\n` +
                      `*New Message:*\n"${newMessage}"\n\n` +
                      `*Set by:* ${msg.pushName || 'Admin'}\n` +
                      `*Group:* ${metadata?.subject || 'Unknown'}\n\n` +
                      `*Available variables:*\n` +
                      `• {user} - New member's name\n` +
                      `• {group} - Group name\n` +
                      `• {members} - Total members\n\n` +
                      `💡 *Test with:* Welcome {user}!\n\n` +
                      `🦊 Perfect welcome message set!`
            });
            return;
        }
    }
};
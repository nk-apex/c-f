// commands/group/setname.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: 'setname',
    alias: ['setgroupname', 'changename', 'renamegroup'],
    category: 'group',
    description: 'Set group name',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'setname')) {
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
                      `Only group admins can set group name!\n\n` +
                      `🦊 Ask an admin to rename group!`
            });
            return;
        }
        
        const newName = args.join(' ');
        
        if (!newName) {
            await sock.sendMessage(chatId, {
                text: `🏷️ *SET GROUP NAME* 🦊\n\n` +
                      `Usage: ${prefix}setname <new_name>\n\n` +
                      `*Requirements:*\n` +
                      `• You must be admin\n` +
                      `• Bot must be admin\n` +
                      `• Name max 25 characters\n\n` +
                      `*Current Name:* ${metadata?.subject || 'Unknown'}\n\n` +
                      `*Example:*\n` +
                      `${prefix}setname Fox Friends Den 🦊\n\n` +
                      `💡 *Choose a catchy name!*\n\n` +
                      `🦊 Give your group a great name!`
            });
            return;
        }
        
        if (newName.length > 25) {
            await sock.sendMessage(chatId, {
                text: `❌ *TOO LONG* 🦊\n\n` +
                      `Group name must be 25 characters or less!\n` +
                      `Current: ${newName.length}/25\n\n` +
                      `💡 *Shorten your group name!*\n\n` +
                      `🦊 Keep it short and memorable!`
            });
            return;
        }
        
        try {
            await sock.groupUpdateSubject(chatId, newName);
            
            await sock.sendMessage(chatId, {
                text: `✅ *GROUP NAME UPDATED!* 🦊\n\n` +
                      `*Old Name:* ${metadata?.subject || 'Unknown'}\n` +
                      `*New Name:* ${newName}\n\n` +
                      `*Changed by:* ${msg.pushName || 'Admin'}\n` +
                      `*Members notified:* Yes\n\n` +
                      `💡 *Everyone will see the new name!*\n` +
                      `Make it representative of your group.\n\n` +
                      `🦊 Great new name! Welcome to ${newName}!`
            });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *UPDATE FAILED* 🦊\n\n` +
                      `*Possible reasons:*\n` +
                      `• I'm not an admin\n` +
                      `• Name too long\n` +
                      `• Permission denied\n\n` +
                      `💡 *Make me admin first!*\n\n` +
                      `🦊 I need admin rights to rename group!`
            });
        }
    }
};
// commands/group/setdesc.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: 'setdesc',
    alias: ['setdescription', 'changedesc', 'desc'],
    category: 'group',
    description: 'Set group description',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'setdesc')) {
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
                      `Only group admins can set description!\n\n` +
                      `🦊 Ask an admin to change description!`
            });
            return;
        }
        
        const newDescription = args.join(' ');
        
        if (!newDescription) {
            await sock.sendMessage(chatId, {
                text: `📝 *SET GROUP DESCRIPTION* 🦊\n\n` +
                      `Usage: ${prefix}setdesc <description>\n\n` +
                      `*Requirements:*\n` +
                      `• You must be admin\n` +
                      `• Bot must be admin\n` +
                      `• Description max 1024 characters\n\n` +
                      `*Example:*\n` +
                      `${prefix}setdesc Welcome to our friendly group! 🦊\n\n` +
                      `💡 *Describe your group purpose!*\n\n` +
                      `🦊 Make your group stand out!`
            });
            return;
        }
        
        if (newDescription.length > 1024) {
            await sock.sendMessage(chatId, {
                text: `❌ *TOO LONG* 🦊\n\n` +
                      `Description must be 1024 characters or less!\n` +
                      `Current: ${newDescription.length}/1024\n\n` +
                      `💡 *Shorten your description!*\n\n` +
                      `🦊 Keep it concise and clear!`
            });
            return;
        }
        
        try {
            await sock.groupUpdateDescription(chatId, newDescription);
            
            await sock.sendMessage(chatId, {
                text: `✅ *DESCRIPTION UPDATED!* 🦊\n\n` +
                      `*New Description:*\n${newDescription}\n\n` +
                      `*Changed by:* ${msg.pushName || 'Admin'}\n` +
                      `*Group:* ${metadata?.subject || 'Unknown'}\n\n` +
                      `💡 *Everyone can see this description!*\n` +
                      `Make it informative and welcoming.\n\n` +
                      `🦊 Perfect description set!`
            });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *UPDATE FAILED* 🦊\n\n` +
                      `*Possible reasons:*\n` +
                      `• I'm not an admin\n` +
                      `• Description too long\n` +
                      `• Permission denied\n\n` +
                      `💡 *Make me admin first!*\n\n` +
                      `🦊 I need admin rights to update description!`
            });
        }
    }
};
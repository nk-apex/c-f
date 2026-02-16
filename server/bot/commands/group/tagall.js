// commands/group/tagall.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: 'tagall',
    alias: ['mentionall', 'everyone', 'alertall'],
    category: 'group',
    description: 'Tag all group members',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'tagall')) {
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
                      `Only group admins can tag everyone!\n\n` +
                      `🦊 Ask an admin for important announcements!`
            });
            return;
        }
        
        const message = args.join(' ') || 'Important announcement! 🦊';
        
        let tagText = `📢 *ANNOUNCEMENT* 🦊\n\n`;
        tagText += `${message}\n\n`;
        tagText += `*Tagging all ${metadata.participants.length} members:*\n`;
        
        // Tag first 20 members to avoid too long message
        const members = metadata.participants.slice(0, 20);
        members.forEach(member => {
            tagText += `@${member.id.split('@')[0]} `;
        });
        
        if (metadata.participants.length > 20) {
            tagText += `\n\n*And ${metadata.participants.length - 20} more members...*`;
        }
        
        tagText += `\n\n💡 *Use responsibly!*\n`;
        tagText += `Only for important announcements.\n\n`;
        tagText += `🦊 Message from: ${msg.pushName || 'Admin'}`;
        
        await sock.sendMessage(chatId, { 
            text: tagText,
            mentions: members.map(m => m.id)
        });
    }
};
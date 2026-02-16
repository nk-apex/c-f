// commands/group/groupinfo.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

export default {
    name: 'groupinfo',
    alias: ['ginfo', 'infogroup', 'group'],
    category: 'group',
    description: 'Show group information',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'groupinfo')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(chatId, { text: message });
            return;
        }
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: `❌ *GROUP ONLY* 🦊\n\nThis command works in groups only!`
            });
            return;
        }
        
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            
            const admins = participants.filter(p => p.admin).length;
            const members = participants.length;
            
            const createdAt = new Date(metadata.creation * 1000).toLocaleDateString();
            
            let infoText = `🏷️ *GROUP INFORMATION* 🦊\n\n`;
            infoText += `*Name:* ${metadata.subject}\n`;
            infoText += `*ID:* ${metadata.id}\n`;
            infoText += `*Description:* ${metadata.desc || 'No description'}\n\n`;
            infoText += `*Members:* ${members} total\n`;
            infoText += `*Admins:* ${admins}\n`;
            infoText += `*Created:* ${createdAt}\n`;
            infoText += `*Owner:* @${metadata.owner.split('@')[0] || 'Unknown'}\n\n`;
            
            infoText += `👑 *Admins List:*\n`;
            const adminList = participants.filter(p => p.admin).slice(0, 10);
            adminList.forEach(admin => {
                const name = metadata.participants.find(p => p.id === admin.id)?.name || 'User';
                infoText += `• @${admin.id.split('@')[0]} (${name})\n`;
            });
            
            if (admins > 10) infoText += `... and ${admins - 10} more admins\n`;
            
            infoText += `\n💡 *Group Commands:*\n`;
            infoText += `${prefix}setname - Change group name\n`;
            infoText += `${prefix}setdesc - Change description\n`;
            infoText += `${prefix}admin - Promote/demote\n`;
            infoText += `${prefix}invite - Get group invite\n\n`;
            infoText += `🦊 Use ${prefix}help group for more!`;
            
            await sock.sendMessage(chatId, {
                text: infoText,
                mentions: [...adminList.map(a => a.id), metadata.owner]
            });
            
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *ERROR* 🦊\n\nCould not fetch group information!\n\n🦊 Try again later!`
            });
        }
    }
};
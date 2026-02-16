// commands/group/listadmins.js
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'listadmins',
    alias: ['admins', 'showadmins', 'adminlist'],
    category: 'group',
    description: 'List all group admins',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        
        if (!foxCanUse(msg, 'listadmins')) {
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
        if (!metadata) {
            await sock.sendMessage(chatId, {
                text: `❌ *CANNOT FETCH DATA* 🦊\n\n` +
                      `Failed to get group information.\n` +
                      `Make sure I'm still in the group.\n\n` +
                      `🦊 Try again later!`
            });
            return;
        }
        
        const admins = metadata.participants.filter(p => p.admin);
        const total = metadata.participants.length;
        
        let adminText = `👑 *GROUP ADMINS* 🦊\n`;
        adminText += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        adminText += `*Group:* ${metadata.subject}\n`;
        adminText += `*Total Members:* ${total}\n`;
        adminText += `*Total Admins:* ${admins.length}\n\n`;
        
        if (admins.length === 0) {
            adminText += `*No admins found!*\n`;
            adminText += `This is unusual for a group.\n\n`;
            adminText += `🦊 Contact group creator!`;
        } else {
            adminText += `*Admin List:*\n`;
            admins.forEach((admin, index) => {
                const number = admin.id.split('@')[0];
                const name = admin.name || admin.notify || `User ${number.slice(-4)}`;
                adminText += `${index + 1}. ${name}\n`;
            });
            
            adminText += `\n💡 *Need admin help?*\n`;
            adminText += `Tag them or send a private message.\n\n`;
            adminText += `🦊 Respect your admins!`;
        }
        
        await sock.sendMessage(chatId, { text: adminText });
    }
};
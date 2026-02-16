// commands/group/vcf.js
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'vcf',
    alias: ['contact', 'sharecontact', 'vcard'],
    category: 'group',
    description: 'Share contact/vCard information',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'vcf')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `📇 *VCARD SHARER* 🦊\n\n` +
                      `Usage: ${prefix}vcf @user\n` +
                      `OR ${prefix}vcf <phone_number>\n\n` +
                      `*What it does:*\n` +
                      `• Creates contact information\n` +
                      `• Share as vCard (.vcf)\n` +
                      `• Easy contact saving\n\n` +
                      `*Examples:*\n` +
                      `${prefix}vcf @friend\n` +
                      `${prefix}vcf 1234567890\n\n` +
                      `💡 *Phone format:* CountryCode+Number\n` +
                      `Example: 923331234567\n\n` +
                      `🦊 Share contacts easily!`
            });
            return;
        }
        
        const targetId = mentioned[0];
        const targetNumber = targetId.split('@')[0];
        
        // Create vCard
        const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:User ${targetNumber.slice(-4)}
TEL;TYPE=CELL:+${targetNumber}
NOTE:Shared via Fox Bot 🦊
END:VCARD
        `.trim();
        
        await sock.sendMessage(msg.key.remoteJid, {
            text: `📇 *CONTACT SHARED* 🦊\n\n` +
                  `*Contact for:* +${targetNumber}\n` +
                  `*Shared by:* ${msg.pushName || 'Anonymous'}\n\n` +
                  `💡 *Save this contact:*\n` +
                  `1. Download the vCard\n` +
                  `2. Open with contacts app\n` +
                  `3. Save to phonebook\n\n` +
                  `🦊 Making connections easier!`,
            contacts: {
                displayName: `User ${targetNumber.slice(-4)}`,
                contacts: [{
                    displayName: `User ${targetNumber.slice(-4)}`,
                    vcard: vcard
                }]
            }
        });
    }
};
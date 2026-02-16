// commands/system/setbotname.js - SET BOT NAME COMMAND
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_NAME_FILE = path.join(__dirname, '../../config/botname.json');

// Function to load bot name
function loadBotName() {
    try {
        if (fs.existsSync(BOT_NAME_FILE)) {
            const data = JSON.parse(fs.readFileSync(BOT_NAME_FILE, 'utf8'));
            return data.name || '🦊 Foxy Bot';
        }
    } catch (error) {
        console.error('❌ Error loading bot name:', error);
    }
    return '🦊 Foxy Bot';
}

// Function to save bot name
function saveBotName(newName) {
    try {
        const dir = path.dirname(BOT_NAME_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(BOT_NAME_FILE, JSON.stringify({ name: newName }, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving bot name:', error);
        return false;
    }
}

export default {
    name: 'setbotname',
    alias: ['changename', 'renamebot', 'botname'],
    category: 'system',
    description: 'Change the bot\'s display name (Owner only)',
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, context) {
        const chatId = msg.key.remoteJid;
        const isOwner = context?.isOwner || false;
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Permission Denied*\nThis command is only for the bot owner.` 
            }, { quoted: msg });
            return;
        }
        
        if (args.length === 0) {
            const currentName = loadBotName();
            await sock.sendMessage(chatId, { 
                text: `🦊 *Current Bot Name:* ${currentName}\n\n*Usage:* ${prefix}setbotname <new name>\n*Example:* ${prefix}setbotname 🦊 FoxMaster 2.0\n\n*Note:* Maximum 30 characters allowed.` 
            }, { quoted: msg });
            return;
        }
        
        const newName = args.join(' ').trim();
        
        // Name validation
        if (newName.length > 30) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Name Too Long*\nMaximum 30 characters allowed. Current: ${newName.length} chars.\n\n*Try:* ${prefix}setbotname ${newName.substring(0, 30)}` 
            }, { quoted: msg });
            return;
        }
        
        if (newName.length < 2) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Name Too Short*\nMinimum 2 characters required.` 
            }, { quoted: msg });
            return;
        }
        
        // Check for dangerous characters (optional)
        const dangerousChars = ['@', '#', '$', '%', '^', '&', '*', '(', ')', '=', '+', '[', ']', '{', '}', '|', '\\', ';', ':', '"', "'", '<', '>', ',', '?', '/'];
        const hasDangerous = dangerousChars.some(char => newName.includes(char));
        
        if (hasDangerous) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Invalid Characters*\nPlease avoid special characters that might cause issues.\n\n*Allowed:* Letters, numbers, spaces, and basic emojis.` 
            }, { quoted: msg });
            return;
        }
        
        // Save the new name
        const success = saveBotName(newName);
        
        if (success) {
            // Update global context if available
            if (context) {
                context.BOT_NAME = newName;
            }
            
            await sock.sendMessage(chatId, { 
                text: `✅ *Bot Name Updated Successfully!*\n\n🦊 *Old Name:* ${loadBotName()}\n🦊 *New Name:* ${newName}\n📊 *Changes will take effect immediately*\n\n*Now use:* ${prefix}menu to see the new name.` 
            }, { quoted: msg });
            
            // Also update the bot's profile name if desired
            try {
                // Uncomment if you want to change WhatsApp profile name too
                // await sock.updateProfileName(newName);
                // console.log(`🦊 Profile name updated to: ${newName}`);
            } catch (error) {
                console.log('Note: Could not update profile name, but bot name is saved.');
            }
            
            // Send a test menu with new name
            setTimeout(async () => {
                try {
                    await sock.sendMessage(chatId, { 
                        text: `🦊 *Test:* Here's how your new bot name looks:\n\n${newName} v${context?.version || '2.0.0'}\n\nUse ${prefix}menu to see the full menu with new name!` 
                    });
                } catch (error) {
                    console.error('Error sending test message:', error);
                }
            }, 1000);
            
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ *Failed to update bot name*\nPlease check the console for errors.\n\n*Try again or contact developer.*` 
            }, { quoted: msg });
        }
    }
};
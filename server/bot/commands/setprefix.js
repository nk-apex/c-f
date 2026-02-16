// File: ./commands/owner/setprefix.js
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default {
    name: 'setprefix',
    alias: ['prefix'],
    category: 'owner',
    description: 'Change bot prefix (use "none" for no prefix)',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(chatId, {
                text: `🔧 *SET PREFIX*\n\nCurrent prefix: "${PREFIX || 'none'}"\n\nUsage: ${PREFIX}setprefix <new_prefix>\nExample:\n${PREFIX}setprefix !\n${PREFIX}setprefix >>\n${PREFIX}setprefix none (to remove prefix)\n\n⚠️ Max 5 characters or "none" to remove prefix`
            }, { quoted: msg });
        }
        
        const input = args[0].trim();
        
        // Check if they want no prefix
        if (input.toLowerCase() === 'none') {
            const newPrefix = ''; // Empty string for no prefix
            
            try {
                const prefixFile = join(process.cwd(), 'prefix_config.json');
                
                // Read current config
                let config = {};
                if (existsSync(prefixFile)) {
                    try {
                        config = JSON.parse(readFileSync(prefixFile, 'utf8'));
                    } catch (e) {
                        config = {};
                    }
                }
                
                const oldPrefix = config.prefix || PREFIX || '.';
                const displayOld = oldPrefix || 'none';
                
                // Update config
                config.prefix = '';
                config.updatedAt = new Date().toISOString();
                config.updatedBy = extra.OWNER_NUMBER || 'unknown';
                config.previousPrefix = oldPrefix;
                config.hasPrefix = false;
                config.isNoPrefix = true;
                
                // Save to file
                writeFileSync(prefixFile, JSON.stringify(config, null, 2));
                
                // Update bot's memory
                let updateSuccess = false;
                
                // Method 1: Use extra.updatePrefix if available
                if (typeof extra.updatePrefix === 'function') {
                    const result = extra.updatePrefix('');
                    updateSuccess = result && result.success;
                }
                
                // Method 2: Update global variables
                if (typeof global !== 'undefined') {
                    global.CURRENT_PREFIX = '';
                    global.prefix = '';
                    updateSuccess = true;
                }
                
                // Method 3: Update process.env
                process.env.PREFIX = '';
                
                await sock.sendMessage(chatId, {
                    text: `🚫 *PREFIX REMOVED!*\n\n` +
                          `Old prefix: "${displayOld}"\n` +
                          `New: No prefix required!\n\n` +
                          `✅ Commands now work WITHOUT prefix!\n` +
                          `Example: ping (instead of .ping)\n` +
                          `Works immediately!`
                }, { quoted: msg });
                
            } catch (error) {
                await sock.sendMessage(chatId, {
                    text: `❌ Error removing prefix: ${error.message}`
                }, { quoted: msg });
            }
            
            return; // Stop here for "none" case
        }
        
        // Normal prefix change (not "none")
        const newPrefix = input;
        
        if (newPrefix.length > 5) {
            return sock.sendMessage(chatId, {
                text: '❌ Prefix too long! Max 5 characters.\nExample: `.` `!` `#` `>>` `wolf`\nOr use "none" to remove prefix'
            }, { quoted: msg });
        }
        
        if (newPrefix.length === 0) {
            return sock.sendMessage(chatId, {
                text: '❌ Prefix cannot be empty! Use "none" to remove prefix.'
            }, { quoted: msg });
        }
        
        // Special characters warning
        if (newPrefix.match(/[\\\/<>]/)) {
            return sock.sendMessage(chatId, {
                text: '❌ Avoid these characters: \\ / < >'
            }, { quoted: msg });
        }
        
        try {
            const prefixFile = join(process.cwd(), 'prefix_config.json');
            
            // Read current config
            let config = {};
            if (existsSync(prefixFile)) {
                try {
                    config = JSON.parse(readFileSync(prefixFile, 'utf8'));
                } catch (e) {
                    config = {};
                }
            }
            
            const oldPrefix = config.prefix || PREFIX || '.';
            const displayOld = oldPrefix || 'none';
            
            // Update config
            config.prefix = newPrefix;
            config.updatedAt = new Date().toISOString();
            config.updatedBy = extra.OWNER_NUMBER || 'unknown';
            config.previousPrefix = oldPrefix;
            config.hasPrefix = true;
            config.isNoPrefix = false;
            
            // Save to file
            writeFileSync(prefixFile, JSON.stringify(config, null, 2));
            
            // Update bot's memory
            let updateSuccess = false;
            
            // Method 1: Use extra.updatePrefix if available
            if (typeof extra.updatePrefix === 'function') {
                const result = extra.updatePrefix(newPrefix);
                updateSuccess = result && result.success;
            }
            
            // Method 2: Update global variables
            if (typeof global !== 'undefined') {
                global.CURRENT_PREFIX = newPrefix;
                global.prefix = newPrefix;
                updateSuccess = true;
            }
            
            // Method 3: Update process.env
            process.env.PREFIX = newPrefix;
            
            await sock.sendMessage(chatId, {
                text: `✅ *PREFIX UPDATED!*\n\n` +
                      `Old: "${displayOld}" → New: "${newPrefix}"\n\n` +
                      `Try: ${newPrefix}ping\n` +
                      `✅ Works immediately!`
            }, { quoted: msg });
            
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};
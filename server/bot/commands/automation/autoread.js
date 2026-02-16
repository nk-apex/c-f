import fs from 'fs';

const settingsFile = './data/autoread_settings.json';

// Ensure settings file exists
function initSettings() {
    const dir = './data';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(settingsFile)) {
        const initialSettings = {
            enabled: false,
            mode: 'both', // 'groups', 'dms', 'both', 'off'
            delay: 2000, // 2 seconds delay before marking as read
            whitelist: [], // Users/groups to exclude from autoread
            blacklist: [], // Users/groups to include even if not in mode
            silent: true // Silent mode - don't show terminal messages
        };
        fs.writeFileSync(settingsFile, JSON.stringify(initialSettings, null, 2));
    }
}

initSettings();

// Load settings
function loadSettings() {
    try {
        const data = fs.readFileSync(settingsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('🦊 Error loading autoread settings:', error);
        return {
            enabled: false,
            mode: 'both',
            delay: 2000,
            whitelist: [],
            blacklist: [],
            silent: true
        };
    }
}

// Save settings
function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('🦊 Error saving autoread settings:', error);
    }
}

// Clean JID helper function
function cleanJid(jid) {
    if (!jid) return jid;
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

// Auto-read message function
async function markAsRead(sock, jid, messageId) {
    try {
        await sock.readMessages([{ remoteJid: jid, id: messageId }]);
        return true;
    } catch (error) {
        // Silent fail - don't show error in terminal
        return false;
    }
}

// Process and auto-read messages
let autoreadActive = false;

function setupAutoread(sock) {
    if (autoreadActive) return;
    
    const settings = loadSettings();
    
    // Only show initial activation message if not silent
    if (!settings.silent) {
        console.log('🦊 Setting up auto-read feature...');
    }
    
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            const settings = loadSettings();
            
            // Check if autoread is enabled
            if (!settings.enabled || settings.mode === 'off') {
                return;
            }
            
            for (const message of messages) {
                // Skip if message is from us
                if (message.key.fromMe) {
                    continue;
                }
                
                const chatJid = cleanJid(message.key.remoteJid);
                const isGroup = chatJid.endsWith('@g.us');
                const messageId = message.key.id;
                
                // Check whitelist (exclude)
                if (settings.whitelist.includes(chatJid)) {
                    continue;
                }
                
                // Check blacklist (force include)
                const forceRead = settings.blacklist.includes(chatJid);
                
                // Check mode
                let shouldRead = false;
                
                if (forceRead) {
                    shouldRead = true;
                } else if (settings.mode === 'both') {
                    shouldRead = true;
                } else if (settings.mode === 'groups' && isGroup) {
                    shouldRead = true;
                } else if (settings.mode === 'dms' && !isGroup) {
                    shouldRead = true;
                }
                
                if (shouldRead) {
                    // Delay before marking as read
                    setTimeout(async () => {
                        await markAsRead(sock, chatJid, messageId);
                        // Silent operation - no success messages
                    }, settings.delay);
                }
            }
        } catch (error) {
            // Silent fail
        }
    });
    
    autoreadActive = true;
    
    // Only show success message if not silent
    if (!settings.silent) {
        console.log('✅ Foxy auto-read feature activated!');
    }
}

// Get group name helper
async function getGroupName(sock, groupJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        return metadata.subject;
    } catch (error) {
        return null;
    }
}

// Get contact name helper
async function getContactName(sock, jid) {
    try {
        const contact = await sock.getContact(jid);
        return contact.name || contact.notify || jid.split('@')[0];
    } catch (error) {
        return jid.split('@')[0];
    }
}

export default {
    name: 'autoread',
    alias: ['autoview', 'autoseen', 'read', 'foxyread'], // Added foxyread alias
    description: 'Automatically mark messages as read',
    category: 'utility',
    ownerOnly: true, // Made owner only for control
    usage: '.autoread [groups/dms/both/off/delay/whitelist/blacklist/silent/test]\nExample: .autoread groups\nExample: .autoread delay 3000\nExample: .autoread test',
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        const sendMessage = async (text) => {
            return await sock.sendMessage(chatId, { text }, { quoted: m });
        };
        
        try {
            // Owner check
            const isOwner = jidManager.isOwner(m);
            
            if (!isOwner) {
                return await sendMessage(
                    `❌ *Owner Only Command!* 🦊\n\n` +
                    `Only the bot owner can use auto-read commands.\n` +
                    `This feature controls automatic message reading.`
                );
            }
            
            const settings = loadSettings();
            const subCommand = args[0]?.toLowerCase();
            const option = args[1]?.toLowerCase();
            
            // Setup autoread if not active
            if (!autoreadActive) {
                setupAutoread(sock);
            }
            
            if (!subCommand || subCommand === 'status') {
                // Show current status
                const statusText = settings.enabled ? `✅ *ACTIVE* 🦊` : `❌ *INACTIVE*`;
                const modeText = settings.mode === 'groups' ? 'Groups Only' :
                               settings.mode === 'dms' ? 'DMs Only' :
                               settings.mode === 'both' ? 'All Messages' : 'Disabled';
                
                let statusMessage = `📖 *Foxy Auto-Read Status* 🦊\n\n`;
                statusMessage += `*Status:* ${statusText}\n`;
                statusMessage += `*Mode:* ${modeText}\n`;
                statusMessage += `*Delay:* ${settings.delay}ms (${settings.delay/1000}s)\n`;
                statusMessage += `*Silent Mode:* ${settings.silent ? '✅ Yes' : '❌ No'}\n`;
                statusMessage += `*Whitelist:* ${settings.whitelist.length} chat(s) excluded\n`;
                statusMessage += `*Blacklist:* ${settings.blacklist.length} chat(s) forced\n\n`;
                
                statusMessage += `📋 *Commands:*\n`;
                statusMessage += `• \`${PREFIX}autoread groups\` - Read only groups\n`;
                statusMessage += `• \`${PREFIX}autoread dms\` - Read only DMs\n`;
                statusMessage += `• \`${PREFIX}autoread both\` - Read everything\n`;
                statusMessage += `• \`${PREFIX}autoread off\` - Disable auto-read\n`;
                statusMessage += `• \`${PREFIX}autoread help\` - Full command list`;
                
                await sendMessage(statusMessage);
                return;
            }
            
            // Log the action
            const senderJid = m.key.participant || chatId;
            const cleaned = jidManager.cleanJid(senderJid);
            
            if (subCommand === 'groups') {
                settings.enabled = true;
                settings.mode = 'groups';
                saveSettings(settings);
                
                console.log(`🦊 Auto-read mode set to 'groups' by: ${cleaned.cleanNumber || 'Owner'}`);
                
                await sendMessage(
                    `✅ *Auto-Read: Groups Only* 🦊\n\n` +
                    `Only group messages will be automatically marked as read.\n` +
                    `Direct messages will NOT be auto-read.\n\n` +
                    `⚙️ *Current Settings:*\n` +
                    `• Delay: ${settings.delay}ms\n` +
                    `• Silent Mode: ${settings.silent ? 'ON' : 'OFF'}\n` +
                    `• Excluded chats: ${settings.whitelist.length}`
                );
            }
            else if (subCommand === 'dms') {
                settings.enabled = true;
                settings.mode = 'dms';
                saveSettings(settings);
                
                console.log(`🦊 Auto-read mode set to 'dms' by: ${cleaned.cleanNumber || 'Owner'}`);
                
                await sendMessage(
                    `✅ *Auto-Read: DMs Only* 🦊\n\n` +
                    `Only direct messages will be automatically marked as read.\n` +
                    `Group messages will NOT be auto-read.\n\n` +
                    `⚙️ *Current Settings:*\n` +
                    `• Delay: ${settings.delay}ms\n` +
                    `• Silent Mode: ${settings.silent ? 'ON' : 'OFF'}\n` +
                    `• Excluded chats: ${settings.whitelist.length}`
                );
            }
            else if (subCommand === 'both') {
                settings.enabled = true;
                settings.mode = 'both';
                saveSettings(settings);
                
                console.log(`🦊 Auto-read mode set to 'both' by: ${cleaned.cleanNumber || 'Owner'}`);
                
                await sendMessage(
                    `✅ *Auto-Read: All Messages* 🦊\n\n` +
                    `All messages (groups and DMs) will be automatically marked as read.\n` +
                    `Use whitelist to exclude specific chats.\n\n` +
                    `⚙️ *Current Settings:*\n` +
                    `• Delay: ${settings.delay}ms\n` +
                    `• Silent Mode: ${settings.silent ? 'ON' : 'OFF'}\n` +
                    `• Excluded chats: ${settings.whitelist.length}`
                );
            }
            else if (subCommand === 'off') {
                settings.enabled = false;
                settings.mode = 'off';
                saveSettings(settings);
                
                console.log(`🦊 Auto-read disabled by: ${cleaned.cleanNumber || 'Owner'}`);
                
                await sendMessage(
                    `❌ *Auto-Read Disabled* 🦊\n\n` +
                    `Messages will no longer be automatically marked as read.\n\n` +
                    `Use \`${PREFIX}autoread groups\` to enable again.`
                );
            }
            else if (subCommand === 'delay') {
                const delay = parseInt(args[1]);
                if (isNaN(delay) || delay < 0 || delay > 60000) {
                    await sendMessage(
                        `⚠️ *Invalid Delay* 🦊\n\n` +
                        `Please specify a valid delay in milliseconds (0-60000).\n\n` +
                        `*Example:* \`${PREFIX}autoread delay 3000\` for 3 seconds\n` +
                        `*Current:* ${settings.delay}ms (${settings.delay/1000}s)`
                    );
                } else {
                    settings.delay = delay;
                    saveSettings(settings);
                    
                    console.log(`🦊 Auto-read delay set to ${delay}ms by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `✅ *Delay Updated* 🦊\n\n` +
                        `Auto-read delay set to ${delay}ms (${delay/1000} seconds).\n\n` +
                        `Messages will be marked as read after this delay.\n` +
                        `*Too short:* May look unnatural\n` +
                        `*Too long:* May miss messages`
                    );
                }
            }
            else if (subCommand === 'whitelist') {
                const action = args[1]?.toLowerCase();
                
                if (!action) {
                    // Show whitelist
                    if (settings.whitelist.length === 0) {
                        await sendMessage(
                            `📝 *Whitelist (Excluded Chats)* 🦊\n\n` +
                            `No chats in whitelist.\n` +
                            `Messages from all chats will be auto-read (based on mode).\n\n` +
                            `*Usage:*\n` +
                            `• \`${PREFIX}autoread whitelist add\` - Exclude current chat\n` +
                            `• \`${PREFIX}autoread whitelist remove [number]\`\n` +
                            `• \`${PREFIX}autoread whitelist clear\``
                        );
                    } else {
                        let whitelistText = `📝 *Whitelist (Excluded Chats)* 🦊\n\n`;
                        
                        for (let i = 0; i < settings.whitelist.length; i++) {
                            const jid = settings.whitelist[i];
                            const isGroup = jid.endsWith('@g.us');
                            const name = isGroup ? 
                                (await getGroupName(sock, jid)) || 'Unknown Group' :
                                (await getContactName(sock, jid));
                            
                            whitelistText += `${i + 1}. ${name}\n`;
                            whitelistText += `   ${jid.substring(0, 25)}...\n\n`;
                        }
                        
                        whitelistText += `*Commands:*\n`;
                        whitelistText += `• \`${PREFIX}autoread whitelist add\` - Add current chat\n`;
                        whitelistText += `• \`${PREFIX}autoread whitelist remove [number]\`\n`;
                        whitelistText += `• \`${PREFIX}autoread whitelist clear\` - Clear all\n\n`;
                        whitelistText += `💡 Messages from these chats will NOT be auto-read.`;
                        
                        await sendMessage(whitelistText);
                    }
                }
                else if (action === 'add') {
                    const jid = cleanJid(chatId);
                    
                    if (settings.whitelist.includes(jid)) {
                        await sendMessage(`⚠️ This chat is already in the whitelist.`);
                    } else {
                        settings.whitelist.push(jid);
                        saveSettings(settings);
                        
                        const name = chatId.endsWith('@g.us') ? 
                            (await getGroupName(sock, chatId)) || 'Group' :
                            (await getContactName(sock, chatId));
                        
                        console.log(`🦊 Chat added to whitelist by: ${cleaned.cleanNumber || 'Owner'} - ${name}`);
                        
                        await sendMessage(
                            `✅ *Added to Whitelist* 🦊\n\n` +
                            `${name}\n\n` +
                            `Messages from this chat will NOT be auto-read.\n` +
                            `Use \`${PREFIX}autoread whitelist remove\` to undo.`
                        );
                    }
                }
                else if (action === 'remove') {
                    const index = parseInt(args[2]) - 1;
                    
                    if (isNaN(index) || index < 0 || index >= settings.whitelist.length) {
                        await sendMessage(
                            `⚠️ *Invalid Number*\n\n` +
                            `Please specify a valid number (1-${settings.whitelist.length}).\n\n` +
                            `Use \`${PREFIX}autoread whitelist\` to see the list.`
                        );
                    } else {
                        const removedJid = settings.whitelist.splice(index, 1)[0];
                        saveSettings(settings);
                        
                        console.log(`🦊 Chat removed from whitelist by: ${cleaned.cleanNumber || 'Owner'} - ${removedJid}`);
                        
                        await sendMessage(`✅ *Removed from Whitelist*\n\n${removedJid.substring(0, 25)}...`);
                    }
                }
                else if (action === 'clear') {
                    settings.whitelist = [];
                    saveSettings(settings);
                    
                    console.log(`🦊 Whitelist cleared by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `✅ *Whitelist Cleared* 🦊\n\n` +
                        `All excluded chats have been removed.\n` +
                        `Messages from all chats will be auto-read (based on mode).`
                    );
                }
            }
            else if (subCommand === 'blacklist') {
                const action = args[1]?.toLowerCase();
                
                if (!action) {
                    // Show blacklist
                    if (settings.blacklist.length === 0) {
                        await sendMessage(
                            `📝 *Blacklist (Force Read)* 🦊\n\n` +
                            `No chats in blacklist.\n` +
                            `No chats are forced to be auto-read.\n\n` +
                            `*Usage:*\n` +
                            `• \`${PREFIX}autoread blacklist add\` - Force read current chat\n` +
                            `• \`${PREFIX}autoread blacklist remove [number]\`\n` +
                            `• \`${PREFIX}autoread blacklist clear\``
                        );
                    } else {
                        let blacklistText = `📝 *Blacklist (Force Read)* 🦊\n\n`;
                        
                        for (let i = 0; i < settings.blacklist.length; i++) {
                            const jid = settings.blacklist[i];
                            const isGroup = jid.endsWith('@g.us');
                            const name = isGroup ? 
                                (await getGroupName(sock, jid)) || 'Unknown Group' :
                                (await getContactName(sock, jid));
                            
                            blacklistText += `${i + 1}. ${name}\n`;
                            blacklistText += `   ${jid.substring(0, 25)}...\n\n`;
                        }
                        
                        blacklistText += `*Commands:*\n`;
                        blacklistText += `• \`${PREFIX}autoread blacklist add\` - Add current chat\n`;
                        blacklistText += `• \`${PREFIX}autoread blacklist remove [number]\`\n`;
                        blacklistText += `• \`${PREFIX}autoread blacklist clear\` - Clear all\n\n`;
                        blacklistText += `💡 Messages from these chats will ALWAYS be auto-read.`;
                        
                        await sendMessage(blacklistText);
                    }
                }
                else if (action === 'add') {
                    const jid = cleanJid(chatId);
                    
                    if (settings.blacklist.includes(jid)) {
                        await sendMessage(`⚠️ This chat is already in the blacklist.`);
                    } else {
                        settings.blacklist.push(jid);
                        saveSettings(settings);
                        
                        const name = chatId.endsWith('@g.us') ? 
                            (await getGroupName(sock, chatId)) || 'Group' :
                            (await getContactName(sock, chatId));
                        
                        console.log(`🦊 Chat added to blacklist by: ${cleaned.cleanNumber || 'Owner'} - ${name}`);
                        
                        await sendMessage(
                            `✅ *Added to Blacklist* 🦊\n\n` +
                            `${name}\n\n` +
                            `Messages from this chat will ALWAYS be auto-read.\n` +
                            `Use \`${PREFIX}autoread blacklist remove\` to undo.`
                        );
                    }
                }
                else if (action === 'remove') {
                    const index = parseInt(args[2]) - 1;
                    
                    if (isNaN(index) || index < 0 || index >= settings.blacklist.length) {
                        await sendMessage(
                            `⚠️ *Invalid Number*\n\n` +
                            `Please specify a valid number (1-${settings.blacklist.length}).\n\n` +
                            `Use \`${PREFIX}autoread blacklist\` to see the list.`
                        );
                    } else {
                        const removedJid = settings.blacklist.splice(index, 1)[0];
                        saveSettings(settings);
                        
                        console.log(`🦊 Chat removed from blacklist by: ${cleaned.cleanNumber || 'Owner'} - ${removedJid}`);
                        
                        await sendMessage(`✅ *Removed from Blacklist*\n\n${removedJid.substring(0, 25)}...`);
                    }
                }
                else if (action === 'clear') {
                    settings.blacklist = [];
                    saveSettings(settings);
                    
                    console.log(`🦊 Blacklist cleared by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `✅ *Blacklist Cleared* 🦊\n\n` +
                        `All forced read chats have been removed.`
                    );
                }
            }
            else if (subCommand === 'silent') {
                const mode = args[1]?.toLowerCase();
                
                if (mode === 'on') {
                    settings.silent = true;
                    saveSettings(settings);
                    
                    console.log(`🦊 Auto-read silent mode enabled by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `🔇 *Silent Mode Enabled* 🦊\n\n` +
                        `No terminal messages will be shown for auto-read operations.\n` +
                        `Foxy will work quietly in the background.`
                    );
                } else if (mode === 'off') {
                    settings.silent = false;
                    saveSettings(settings);
                    
                    console.log(`🦊 Auto-read silent mode disabled by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `🔊 *Silent Mode Disabled* 🦊\n\n` +
                        `Auto-read operations will show messages in terminal.\n` +
                        `Useful for debugging and monitoring.`
                    );
                } else {
                    const status = settings.silent ? 'enabled 🔇' : 'disabled 🔊';
                    await sendMessage(
                        `*Silent Mode* is currently *${status}* 🦊\n\n` +
                        `*Usage:* \`${PREFIX}autoread silent on/off\`\n\n` +
                        `When silent mode is on:\n` +
                        `• No terminal messages shown\n` +
                        `• Foxy works quietly\n` +
                        `• Better for production use\n\n` +
                        `When silent mode is off:\n` +
                        `• Shows operations in terminal\n` +
                        `• Useful for debugging\n` +
                        `• See which messages are read`
                    );
                }
            }
            else if (subCommand === 'test') {
                // Test current settings
                const isGroup = chatId.endsWith('@g.us');
                const name = isGroup ? 
                    (await getGroupName(sock, chatId)) || 'Group' :
                    (await getContactName(sock, chatId));
                
                let testText = `🧪 *Foxy Auto-Read Test* 🦊\n\n`;
                testText += `*Chat:* ${name}\n`;
                testText += `*Type:* ${isGroup ? 'Group 👥' : 'DM 👤'}\n`;
                testText += `*Mode:* ${settings.mode}\n`;
                testText += `*Enabled:* ${settings.enabled ? '✅ Yes' : '❌ No'}\n`;
                testText += `*In Whitelist:* ${settings.whitelist.includes(chatId) ? '✅ Yes' : '❌ No'}\n`;
                testText += `*In Blacklist:* ${settings.blacklist.includes(chatId) ? '✅ Yes' : '❌ No'}\n\n`;
                
                let shouldRead = false;
                let reason = '';
                
                if (settings.blacklist.includes(chatId)) {
                    shouldRead = true;
                    reason = 'forced by blacklist 🔵';
                } else if (settings.whitelist.includes(chatId)) {
                    shouldRead = false;
                    reason = 'excluded by whitelist 🔴';
                } else if (!settings.enabled) {
                    shouldRead = false;
                    reason = 'disabled 🔴';
                } else if (settings.mode === 'both') {
                    shouldRead = true;
                    reason = 'mode: both 🟢';
                } else if (settings.mode === 'groups' && isGroup) {
                    shouldRead = true;
                    reason = 'mode: groups 🟢';
                } else if (settings.mode === 'dms' && !isGroup) {
                    shouldRead = true;
                    reason = 'mode: dms 🟢';
                } else {
                    shouldRead = false;
                    reason = 'not matching current mode 🔴';
                }
                
                testText += `*Result:* Will ${shouldRead ? 'AUTO-READ' : 'NOT READ'}\n`;
                testText += `*Reason:* ${reason}\n\n`;
                testText += `*Delay:* ${settings.delay}ms (${settings.delay/1000}s)\n`;
                testText += `*Silent Mode:* ${settings.silent ? '✅ Yes' : '❌ No'}`;
                
                await sendMessage(testText);
            }
            else if (subCommand === 'help' || subCommand === 'cmd') {
                await sendMessage(
                    `📖 *FOXY AUTO-READ HELP* 🦊\n\n` +
                    `*Basic Commands:*\n` +
                    `• \`${PREFIX}autoread groups\` - Read only groups\n` +
                    `• \`${PREFIX}autoread dms\` - Read only DMs\n` +
                    `• \`${PREFIX}autoread both\` - Read everything\n` +
                    `• \`${PREFIX}autoread off\` - Disable auto-read\n\n` +
                    `*Configuration:*\n` +
                    `• \`${PREFIX}autoread delay 3000\` - 3 second delay\n` +
                    `• \`${PREFIX}autoread silent on/off\` - Toggle terminal messages\n\n` +
                    `*Chat Management:*\n` +
                    `• \`${PREFIX}autoread whitelist add\` - Exclude current chat\n` +
                    `• \`${PREFIX}autoread blacklist add\` - Force read current chat\n` +
                    `• \`${PREFIX}autoread whitelist/list\` - Show excluded chats\n` +
                    `• \`${PREFIX}autoread blacklist/list\` - Show forced chats\n\n` +
                    `*Info & Testing:*\n` +
                    `• \`${PREFIX}autoread\` - Show status\n` +
                    `• \`${PREFIX}autoread status\` - Detailed status\n` +
                    `• \`${PREFIX}autoread test\` - Test current settings\n\n` +
                    `*Examples:*\n` +
                    `\`${PREFIX}autoread groups\`\n` +
                    `\`${PREFIX}autoread delay 5000\`\n` +
                    `\`${PREFIX}autoread silent on\`\n` +
                    `\`${PREFIX}autoread test\`\n\n` +
                    `💡 *Tip:* Use silent mode for production, disable for debugging.`
                );
            }
            else {
                // Show help
                await sendMessage(
                    `❓ *Invalid Command* 🦊\n\n` +
                    `*Available commands:*\n` +
                    `• \`${PREFIX}autoread groups/dms/both/off\`\n` +
                    `• \`${PREFIX}autoread delay <ms>\`\n` +
                    `• \`${PREFIX}autoread test\`\n` +
                    `• \`${PREFIX}autoread help\`\n\n` +
                    `Type \`${PREFIX}autoread help\` for full command list.`
                );
            }
            
        } catch (error) {
            console.error('🦊 Auto-read command error:', error);
            await sendMessage(
                `❌ *Command Failed* 🦊\n\n` +
                `Error: ${error.message}\n` +
                `Try again or check the settings file.`
            );
        }
    }
};

// Export setup function for manual initialization
export function startAutoread(sock) {
    if (!autoreadActive) {
        setupAutoread(sock);
        autoreadActive = true;
    }
}
// commands/owner/autotyping.js

// AutoTyping Manager (State Management)
const autoTypingConfig = {
  enabled: false,
  duration: 10, // seconds
  autoReply: false, // Disabled by default to avoid spam
  activeTypers: new Map(), // chatJid -> {intervalId, timeoutId, userCount, startTime, lastMessageTime}
  botSock: null,
  isHooked: false,
  ownerOnly: true, // Default to owner-only mode
  allowedUsers: new Set() // Users allowed to use command (besides owner)
};

class AutoTypingManager {
  static initialize(sock) {
    if (!autoTypingConfig.isHooked && sock) {
      autoTypingConfig.botSock = sock;
      this.hookIntoBot();
      autoTypingConfig.isHooked = true;
      console.log('🦊 Auto-typing system initialized!');
    }
  }

  static hookIntoBot() {
    if (!autoTypingConfig.botSock || !autoTypingConfig.botSock.ev) {
      console.log('⚠️ Could not hook into bot events');
      return;
    }
    
    // Add our handler alongside existing ones
    autoTypingConfig.botSock.ev.on('messages.upsert', async (data) => {
      await this.handleIncomingMessage(data);
    });
    
    console.log('✅ Auto-typing successfully hooked into message events');
  }

  static async handleIncomingMessage(data) {
    try {
      if (!data || !data.messages || data.messages.length === 0) return;
      
      const m = data.messages[0];
      const sock = autoTypingConfig.botSock;
      
      // Skip if not enabled or if it's from the bot itself
      if (!m || !m.key || m.key.fromMe || !autoTypingConfig.enabled) return;
      
      // Check if it's a command (starts with prefix, usually ".")
      const messageText = m.message?.conversation || 
                         m.message?.extendedTextMessage?.text || 
                         m.message?.imageMessage?.caption || '';
      
      // Skip if it's a command
      if (messageText.trim().startsWith('.')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return;
      }
      
      const userJid = m.key.participant || m.key.remoteJid;
      const chatJid = m.key.remoteJid;
      
      if (!userJid || !chatJid) return;
      
      const now = Date.now();
      
      // Check if chat already has active typing
      if (autoTypingConfig.activeTypers.has(chatJid)) {
        const typerData = autoTypingConfig.activeTypers.get(chatJid);
        
        // Update last message time and user count
        typerData.lastMessageTime = now;
        typerData.userCount++;
        
        // Clear the existing timeout
        if (typerData.timeoutId) {
          clearTimeout(typerData.timeoutId);
        }
        
        // Set a new timeout that extends from NOW
        typerData.timeoutId = setTimeout(async () => {
          await this.stopTypingInChat(chatJid, sock);
        }, autoTypingConfig.duration * 1000);
        
        autoTypingConfig.activeTypers.set(chatJid, typerData);
        return;
      }
      
      // Start typing indicator in this chat
      await sock.sendPresenceUpdate('composing', chatJid);
      
      let isTyping = true;
      
      // Function to keep typing alive
      const keepTypingAlive = async () => {
        if (isTyping && autoTypingConfig.enabled) {
          try {
            await sock.sendPresenceUpdate('composing', chatJid);
          } catch (err) {
            // Ignore errors in keep-alive
          }
        }
      };
      
      // Keep refreshing the typing indicator every 2 seconds
      const typingInterval = setInterval(keepTypingAlive, 2000);
      
      // Set timeout to stop typing
      const timeoutId = setTimeout(async () => {
        isTyping = false;
        await this.stopTypingInChat(chatJid, sock);
      }, autoTypingConfig.duration * 1000);
      
      // Store typing data for this chat
      autoTypingConfig.activeTypers.set(chatJid, {
        intervalId: typingInterval,
        timeoutId: timeoutId,
        userCount: 1,
        startTime: now,
        lastMessageTime: now,
        isTyping: true
      });
      
    } catch (err) {
      console.error("Auto-typing handler error:", err);
    }
  }

  static async stopTypingInChat(chatJid, sock) {
    if (autoTypingConfig.activeTypers.has(chatJid)) {
      const typerData = autoTypingConfig.activeTypers.get(chatJid);
      
      // Clear interval and timeout
      clearInterval(typerData.intervalId);
      if (typerData.timeoutId) {
        clearTimeout(typerData.timeoutId);
      }
      
      autoTypingConfig.activeTypers.delete(chatJid);
      
      // Stop typing indicator
      try {
        await sock.sendPresenceUpdate('paused', chatJid);
      } catch (err) {
        // Ignore stop errors
      }
      
      // Send auto-reply if enabled
      if (autoTypingConfig.autoReply && autoTypingConfig.enabled) {
        try {
          await sock.sendMessage(chatJid, {
            text: `🦊 *Foxy is typing...*\n\nI was composing a reply for ${autoTypingConfig.duration} seconds! 🦊`
          });
        } catch (err) {
          console.error("Failed to send auto-reply:", err);
        }
      }
    }
  }

  // Check if user is authorized to use the command
  static isAuthorized(msg, extra = {}) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    
    // Check if fromMe (bot itself)
    if (msg.key.fromMe) return true;
    
    // Check if owner only mode is enabled
    if (autoTypingConfig.ownerOnly) {
      // Use the owner check logic from your jidManager
      if (extra.jidManager) {
        return extra.jidManager.isOwner(msg);
      }
      return false;
    }
    
    // If not owner-only, check allowed users
    if (autoTypingConfig.allowedUsers.has(senderJid)) {
      return true;
    }
    
    // Check if it's the owner using the jidManager
    if (extra.jidManager) {
      return extra.jidManager.isOwner(msg);
    }
    
    return false;
  }

  static toggle() {
    autoTypingConfig.enabled = !autoTypingConfig.enabled;
    console.log(`🦊 Auto-typing ${autoTypingConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!autoTypingConfig.enabled) {
      this.clearAllTypers();
    }
    
    return autoTypingConfig.enabled;
  }

  static status() {
    return {
      enabled: autoTypingConfig.enabled,
      duration: autoTypingConfig.duration,
      autoReply: autoTypingConfig.autoReply,
      activeSessions: autoTypingConfig.activeTypers.size,
      isHooked: autoTypingConfig.isHooked,
      ownerOnly: autoTypingConfig.ownerOnly,
      totalUsersTyping: this.getTotalUsersTyping()
    };
  }

  static getTotalUsersTyping() {
    let total = 0;
    autoTypingConfig.activeTypers.forEach(typerData => {
      total += typerData.userCount;
    });
    return total;
  }

  static setDuration(seconds) {
    if (seconds >= 1 && seconds <= 60) {
      autoTypingConfig.duration = seconds;
      return true;
    }
    return false;
  }

  static toggleAutoReply() {
    autoTypingConfig.autoReply = !autoTypingConfig.autoReply;
    return autoTypingConfig.autoReply;
  }

  static toggleOwnerOnly() {
    autoTypingConfig.ownerOnly = !autoTypingConfig.ownerOnly;
    return autoTypingConfig.ownerOnly;
  }

  static addAllowedUser(jid) {
    autoTypingConfig.allowedUsers.add(jid);
    return true;
  }

  static removeAllowedUser(jid) {
    autoTypingConfig.allowedUsers.delete(jid);
    return true;
  }

  static getAllowedUsers() {
    return Array.from(autoTypingConfig.allowedUsers);
  }

  static clearAllTypers() {
    autoTypingConfig.activeTypers.forEach((typerData) => {
      clearInterval(typerData.intervalId);
      if (typerData.timeoutId) {
        clearTimeout(typerData.timeoutId);
      }
    });
    autoTypingConfig.activeTypers.clear();
  }

  static async manualTyping(sock, chatJid, duration, quotedMsg = null) {
    try {
      // Send initial message
      if (quotedMsg) {
        await sock.sendMessage(chatJid, {
          text: `🦊 *Foxy is typing...*\n\nI'll show 'typing...' for ${duration} seconds! 🦊`
        }, { quoted: quotedMsg });
      }
      
      // Start typing indicator
      await sock.sendPresenceUpdate('composing', chatJid);
      
      let isTyping = true;
      
      // Function to keep typing alive
      const keepTypingAlive = async () => {
        if (isTyping) {
          await sock.sendPresenceUpdate('composing', chatJid);
        }
      };
      
      // Keep refreshing the typing indicator every 2 seconds
      const typingInterval = setInterval(keepTypingAlive, 2000);
      
      // Set timeout to stop typing
      const timeoutId = setTimeout(async () => {
        isTyping = false;
        clearInterval(typingInterval);
        
        // Stop typing indicator
        await sock.sendPresenceUpdate('paused', chatJid);
        
        // Send completion message
        if (quotedMsg) {
          await sock.sendMessage(chatJid, {
            text: `✅ *Typing complete!* 🦊\n\nFoxy was typing for ${duration} seconds!`
          }, { quoted: quotedMsg });
        }
      }, duration * 1000);
      
      // Store this manual typing session
      const sessionKey = `manual_${chatJid}_${Date.now()}`;
      autoTypingConfig.activeTypers.set(sessionKey, {
        intervalId: typingInterval,
        timeoutId: timeoutId,
        userCount: 1,
        startTime: Date.now(),
        lastMessageTime: Date.now(),
        isManual: true
      });
      
    } catch (err) {
      console.error("Manual typing error:", err);
      throw err;
    }
  }
}

// Main Command Export
export default {
  name: "autotyping",
  alias: ["autotype", "fake", "typingsim", "typingtoggle", "atype", "typingmode", "typing", "foxytype"], // Added foxytype alias
  desc: "Toggle auto fake typing when someone messages you 🦊",
  category: "owner",
  ownerOnly: true,
  usage: ".autotyping [on/off/duration/reply/mode/users/status/help]\nExample: .autotyping on\nExample: .autotyping 15\nExample: .autotyping status",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      // ==================== OWNER CHECK ====================
      const isOwner = jidManager.isOwner(m);
      
      if (!isOwner) {
        return await sendMessage(
          `❌ *Owner Only Command!* 🦊\n\n` +
          `Only the bot owner can use auto typing commands.\n` +
          `This feature controls automatic typing indicators.`
        );
      }
      // ==================== END OWNER CHECK ====================
      
      // Initialize on first command use
      if (!autoTypingConfig.isHooked) {
        autoTypingConfig.botSock = sock;
        AutoTypingManager.hookIntoBot();
        autoTypingConfig.isHooked = true;
        console.log('🦊 Auto-typing system initialized!');
      }
      
      if (args.length === 0) {
        // Show status
        const status = AutoTypingManager.status();
        const statusText = status.enabled ? "✅ *ACTIVE* 🦊" : "❌ *INACTIVE*";
        const modeText = status.ownerOnly ? "🔒 *Owner Only*" : "🌍 *Public Mode*";
        
        await sendMessage(
          `🦊 *Foxy Auto Typing*\n\n` +
          `*Status:* ${statusText}\n` +
          `*Duration:* ${status.duration} seconds\n` +
          `*Auto Reply:* ${status.autoReply ? '✅ ON' : '❌ OFF'}\n` +
          `*Mode:* ${modeText}\n` +
          `*Active Chats:* ${status.activeSessions}\n` +
          `*Total Typing:* ${status.totalUsersTyping} users\n\n` +
          `📋 *Commands:*\n` +
          `• \`${PREFIX}autotyping on\` - Enable auto typing\n` +
          `• \`${PREFIX}autotyping off\` - Disable auto typing\n` +
          `• \`${PREFIX}autotyping 15\` - Set duration to 15s\n` +
          `• \`${PREFIX}autotyping status\` - Detailed status\n` +
          `• \`${PREFIX}autotyping help\` - Show all commands`
        );
        return;
      }
      
      const arg = args[0].toLowerCase();
      
      // Show detailed status
      if (arg === 'status' || arg === 'info' || arg === 'stats') {
        const status = AutoTypingManager.status();
        const allowedUsers = AutoTypingManager.getAllowedUsers();
        
        let statusMsg = `🦊 *Foxy Auto Typing Status*\n\n`;
        statusMsg += `📊 *System Status:*\n`;
        statusMsg += `├◆ Enabled: ${status.enabled ? '✅ YES 🦊' : '❌ NO'}\n`;
        statusMsg += `├◆ Duration: ${status.duration} seconds\n`;
        statusMsg += `├◆ Auto Reply: ${status.autoReply ? '✅ ON' : '❌ OFF'}\n`;
        statusMsg += `├◆ Mode: ${status.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}\n`;
        statusMsg += `├◆ Active Chats: ${status.activeSessions}\n`;
        statusMsg += `├◆ Total Users Typing: ${status.totalUsersTyping}\n`;
        statusMsg += `└─ System Hooked: ${status.isHooked ? '✅' : '❌'}\n\n`;
        
        if (allowedUsers.length > 0 && !status.ownerOnly) {
          statusMsg += `👥 *Allowed Users:*\n`;
          allowedUsers.forEach((user, index) => {
            const cleanUser = user.split('@')[0];
            statusMsg += `${index + 1}. ${cleanUser}\n`;
          });
          statusMsg += `\n`;
        }
        
        if (status.activeSessions > 0) {
          statusMsg += `⌨️ *Active Typing Sessions:*\n`;
          autoTypingConfig.activeTypers.forEach((data, chatJid) => {
            const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
            const remaining = Math.max(0, status.duration - elapsed);
            statusMsg += `├◆ ${chatJid.includes('@g.us') ? '👥 Group' : '👤 DM'}\n`;
            statusMsg += `│  ├◆ Users: ${data.userCount}\n`;
            statusMsg += `│  ├◆ Elapsed: ${elapsed}s\n`;
            statusMsg += `│  └─ Remaining: ${remaining}s\n`;
          });
        }
        
        statusMsg += `\n💡 Foxy is watching and typing... 🦊`;
        
        return await sendMessage(statusMsg);
      }
      
      // Toggle on/off
      if (arg === 'on' || arg === 'enable' || arg === 'start' || arg === 'activate') {
        const enabled = AutoTypingManager.toggle();
        
        // Log the action
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`🦊 Auto-typing ${enabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *Auto Typing ${enabled ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
          `${enabled ? 
            'Foxy will now automatically show typing when someone messages you! 🦊👀\n\n' +
            '*How it works:*\n' +
            '• When someone sends a non-command message\n' +
            '• Foxy shows typing indicator\n' +
            '• Lasts for ' + autoTypingConfig.duration + ' seconds\n' +
            '• Works in both DMs and groups' :
            'Foxy has stopped auto typing.\nI will no longer show typing indicators.'}\n\n` +
          `⚙️ *Current Settings:*\n` +
          `• Duration: ${autoTypingConfig.duration}s\n` +
          `• Auto Reply: ${autoTypingConfig.autoReply ? '✅ ON' : '❌ OFF'}\n` +
          `• Mode: ${autoTypingConfig.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}`
        );
        return;
      }
      
      if (arg === 'off' || arg === 'disable' || arg === 'stop' || arg === 'deactivate') {
        const enabled = AutoTypingManager.toggle();
        
        // Log the action
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`🦊 Auto-typing ${enabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `${enabled ? '✅ Enabled' : '❌ Disabled'} *Auto Typing* 🦊\n\n` +
          `${enabled ? 
            'Foxy is now auto typing again!' :
            'Foxy has stopped all typing indicators.\n' +
            'No more "typing..." will be shown automatically.'}\n\n` +
          `Use \`${PREFIX}autotyping on\` to enable again.`
        );
        return;
      }
      
      // Toggle auto-reply
      if (arg === 'reply' || arg === 'autoreply') {
        const autoReply = AutoTypingManager.toggleAutoReply();
        
        await sendMessage(
          `✅ *Auto Reply ${autoReply ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
          `${autoReply ? 
            'Foxy will now send a message after auto typing.\n' +
            'Example: "🦊 Foxy was typing for X seconds!"' : 
            'No completion messages will be sent after typing.\n' +
            'Foxy will type silently.'}\n\n` +
          `⚠️ *Note:* Auto-reply can be seen as spam in groups.\n` +
          `Use carefully!`
        );
        return;
      }
      
      // Mode toggle (owner-only vs public)
      if (arg === 'mode' || arg === 'togglemode' || arg === 'access') {
        const ownerOnly = AutoTypingManager.toggleOwnerOnly();
        
        await sendMessage(
          `🔧 *Typing Mode Changed* 🦊\n\n` +
          `*New Mode:* ${ownerOnly ? '🔒 *OWNER ONLY*' : '🌍 *PUBLIC ACCESS*'}\n\n` +
          `${ownerOnly ? 
            'Only you (owner) can control auto-typing now.\n' +
            'All other users will be blocked.' : 
            'Public mode enabled!\n' +
            'Anyone can use auto-typing commands now.\n\n' +
            '⚠️ *Warning:* This may allow spam!'}\n\n` +
          `⚙️ *User Management:*\n` +
          `• \`${PREFIX}autotyping users add @user\`\n` +
          `• \`${PREFIX}autotyping users list\`\n` +
          `• \`${PREFIX}autotyping users remove @user\``
        );
        return;
      }
      
      // User management
      if (arg === 'users' || arg === 'user' || arg === 'allow' || arg === 'permit') {
        const subCmd = args[1]?.toLowerCase();
        
        if (!subCmd || subCmd === 'list') {
          const allowedUsers = AutoTypingManager.getAllowedUsers();
          let userList = `👥 *Allowed Users* 🦊 (${allowedUsers.length})\n\n`;
          
          if (allowedUsers.length === 0) {
            userList += `No additional users allowed.\n`;
            userList += `Only you (owner) can use this command.\n`;
          } else {
            allowedUsers.forEach((user, index) => {
              const cleanUser = user.split('@')[0];
              userList += `${index + 1}. ${cleanUser}\n`;
            });
          }
          
          userList += `\n🔧 *Commands:*\n`;
          userList += `• \`${PREFIX}autotyping users add @user\`\n`;
          userList += `• \`${PREFIX}autotyping users remove @user\`\n`;
          userList += `• \`${PREFIX}autotyping users clear\``;
          
          return await sendMessage(userList);
        }
        
        if (subCmd === 'add' && args[2]) {
          const userToAdd = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoTypingManager.addAllowedUser(userToAdd);
          
          const cleanUser = userToAdd.split('@')[0];
          
          await sendMessage(
            `✅ *User Added* 🦊\n\n` +
            `Added ${cleanUser} to allowed users list.\n\n` +
            `They can now use auto-typing commands when in public mode.\n` +
            `Current mode: ${autoTypingConfig.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}`
          );
          return;
        }
        
        if (subCmd === 'remove' && args[2]) {
          const userToRemove = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoTypingManager.removeAllowedUser(userToRemove);
          
          const cleanUser = userToRemove.split('@')[0];
          
          await sendMessage(
            `✅ *User Removed* 🦊\n\n` +
            `Removed ${cleanUser} from allowed users list.\n\n` +
            `They can no longer use auto-typing commands.`
          );
          return;
        }
        
        if (subCmd === 'clear') {
          autoTypingConfig.allowedUsers.clear();
          
          await sendMessage(
            `✅ *Users Cleared* 🦊\n\n` +
            `All allowed users have been removed.\n` +
            `Only you (owner) can use auto-typing commands now.`
          );
          return;
        }
        
        // Invalid user command
        await sendMessage(
          `❓ *Invalid User Command*\n\n` +
          `*Usage:*\n` +
          `• \`${PREFIX}autotyping users list\`\n` +
          `• \`${PREFIX}autotyping users add @user\`\n` +
          `• \`${PREFIX}autotyping users remove @user\`\n` +
          `• \`${PREFIX}autotyping users clear\``
        );
        return;
      }
      
      // Set duration
      const duration = parseInt(arg);
      if (!isNaN(duration) && duration >= 1 && duration <= 60) {
        const success = AutoTypingManager.setDuration(duration);
        if (success) {
          await sendMessage(
            `✅ *Duration Updated* 🦊\n\n` +
            `Typing duration set to ${duration} seconds.\n\n` +
            `${AutoTypingManager.status().enabled ? '⌨️ Foxy is currently **AUTO TYPING**' : '💤 Foxy is **SLEEPING** (not typing)'}\n` +
            `• Auto Reply: ${AutoTypingManager.status().autoReply ? '✅ ON' : '❌ OFF'}\n` +
            `• Mode: ${AutoTypingManager.status().ownerOnly ? '🔒 Owner Only' : '🌍 Public'}\n` +
            `• Active Chats: ${AutoTypingManager.status().activeSessions}`
          );
        } else {
          await sendMessage(
            `❌ *Invalid Duration* 🦊\n\n` +
            `Please use a number between 1 and 60 seconds.\n\n` +
            `*Maximum typing time:* 1 minute (60 seconds)\n` +
            `*Recommended:* 5-15 seconds\n` +
            `*Current setting:* ${autoTypingConfig.duration}s`
          );
        }
        return;
      }
      
      // Manual typing trigger
      if (arg === 'test' || arg === 'demo' || arg === 'manual') {
        const testDuration = parseInt(args[1]) || 5;
        
        if (testDuration < 1 || testDuration > 30) {
          return await sendMessage(
            `❌ *Invalid Test Duration*\n\n` +
            `Test duration must be 1-30 seconds.\n` +
            `Example: \`${PREFIX}autotyping test 10\``
          );
        }
        
        await sendMessage(
          `🦊 *Starting Typing Test...*\n\n` +
          `Foxy will show typing for ${testDuration} seconds...`
        );
        
        // Start manual typing
        await AutoTypingManager.manualTyping(sock, chatId, testDuration, m);
        
        return;
      }
      
      // Help command
      if (arg === 'help' || arg === 'cmd' || arg === 'guide') {
        await sendMessage(
          `📖 *FOXY AUTO TYPING HELP* 🦊\n\n` +
          `*Basic Commands:*\n` +
          `• \`${PREFIX}autotyping\` - Show status\n` +
          `• \`${PREFIX}autotyping on\` - Enable auto typing\n` +
          `• \`${PREFIX}autotyping off\` - Disable auto typing\n` +
          `• \`${PREFIX}autotyping 15\` - Set duration to 15s\n\n` +
          `*Advanced Control:*\n` +
          `• \`${PREFIX}autotyping reply\` - Toggle auto-reply messages\n` +
          `• \`${PREFIX}autotyping mode\` - Toggle owner-only/public mode\n` +
          `• \`${PREFIX}autotyping status\` - Detailed status info\n` +
          `• \`${PREFIX}autotyping test 10\` - Test typing for 10s\n\n` +
          `*User Management:*\n` +
          `• \`${PREFIX}autotyping users list\` - Show allowed users\n` +
          `• \`${PREFIX}autotyping users add @user\` - Allow user\n` +
          `• \`${PREFIX}autotyping users remove @user\` - Remove user\n\n` +
          `*Examples:*\n` +
          `\`${PREFIX}autotyping on\`\n` +
          `\`${PREFIX}autotyping 10\`\n` +
          `\`${PREFIX}autotyping status\`\n\n` +
          `⚠️ *Note:* Typing indicators can show in multiple chats!`
        );
        return;
      }
      
      // If no valid command, show help
      await sendMessage(
        `❓ *Invalid Command* 🦊\n\n` +
        `*Available commands:*\n` +
        `• \`${PREFIX}autotyping on/off\`\n` +
        `• \`${PREFIX}autotyping <1-60>\` (set duration)\n` +
        `• \`${PREFIX}autotyping status\`\n` +
        `• \`${PREFIX}autotyping help\`\n\n` +
        `Type \`${PREFIX}autotyping help\` for full command list.`
      );
      
    } catch (err) {
      console.error("AutoTyping command error:", err);
      await sendMessage(
        `❌ *Command Failed* 🦊\n\n` +
        `Error: ${err.message}\n` +
        `Try again or check the command syntax.`
      );
    }
  }
};
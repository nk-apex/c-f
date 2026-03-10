// commands/owner/autorecording.js

// AutoRecording Manager (State Management)
const autoRecordingConfig = {
  enabled: false,
  duration: 10, // seconds
  activeRecorders: new Map(), // chatJid -> {intervalId, userCount, lastMessageTime, timeoutId}
  botSock: null,
  isHooked: false,
  ownerOnly: true, // Default to owner-only mode
  allowedUsers: new Set() // Users allowed to use command (besides owner)
};

class AutoRecordingManager {
  static initialize(sock) {
    if (!autoRecordingConfig.isHooked && sock) {
      autoRecordingConfig.botSock = sock;
      this.hookIntoBot();
      autoRecordingConfig.isHooked = true;
      console.log('🦊 Auto-recording system initialized!');
    }
  }

  static hookIntoBot() {
    if (!autoRecordingConfig.botSock || !autoRecordingConfig.botSock.ev) {
      console.log('⚠️ Could not hook into bot events');
      return;
    }
    
    // Add our handler alongside existing ones
    autoRecordingConfig.botSock.ev.on('messages.upsert', async (data) => {
      await this.handleIncomingMessage(data);
    });
    
    console.log('✅ Auto-recording successfully hooked into message events');
  }

  static async handleIncomingMessage(data) {
    try {
      if (!data || !data.messages || data.messages.length === 0) return;
      
      const m = data.messages[0];
      const sock = autoRecordingConfig.botSock;
      
      // Skip if not enabled or if it's from the bot itself
      if (!m || !m.key || m.key.fromMe || !autoRecordingConfig.enabled) return;
      
      // Check if it's a command (starts with prefix, usually ".")
      const messageText = m.message?.conversation || 
                         m.message?.extendedTextMessage?.text || 
                         m.message?.imageMessage?.caption || '';
      
      // Skip if it's a command (starts with dot or other prefixes)
      const trimmedText = messageText.trim();
      if (trimmedText.startsWith('.') || trimmedText.startsWith('!') || trimmedText.startsWith('/')) {
        return;
      }
      
      const userJid = m.key.participant || m.key.remoteJid;
      const chatJid = m.key.remoteJid;
      
      if (!userJid || !chatJid) return;
      
      // If chat already has active recording, reset the timer
      if (autoRecordingConfig.activeRecorders.has(chatJid)) {
        const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
        
        // Clear existing timeout
        if (recorderData.timeoutId) {
          clearTimeout(recorderData.timeoutId);
        }
        
        // Update user count and last message time
        recorderData.userCount++;
        recorderData.lastMessageTime = Date.now();
        
        // Set new timeout to stop recording
        recorderData.timeoutId = setTimeout(async () => {
          await this.stopRecording(chatJid);
        }, autoRecordingConfig.duration * 1000);
        
        autoRecordingConfig.activeRecorders.set(chatJid, recorderData);
        return;
      }
      
      // Start new recording session
      await this.startRecording(chatJid);
      
    } catch (err) {
      console.error("Auto-recording handler error:", err);
    }
  }

  static async startRecording(chatJid) {
    try {
      const sock = autoRecordingConfig.botSock;
      
      // Start recording indicator in this chat
      await sock.sendPresenceUpdate('recording', chatJid);
      
      let isRecording = true;
      
      // Function to keep recording alive
      const keepRecordingAlive = async () => {
        if (isRecording && autoRecordingConfig.enabled) {
          try {
            await sock.sendPresenceUpdate('recording', chatJid);
          } catch (err) {
            // Ignore errors in keep-alive
          }
        }
      };
      
      // Keep refreshing the recording indicator every 2 seconds
      const recordingInterval = setInterval(keepRecordingAlive, 2000);
      
      // Set timeout to stop recording after duration
      const timeoutId = setTimeout(async () => {
        await this.stopRecording(chatJid);
      }, autoRecordingConfig.duration * 1000);
      
      // Store recording data for this chat
      autoRecordingConfig.activeRecorders.set(chatJid, {
        intervalId: recordingInterval,
        userCount: 1,
        startTime: Date.now(),
        lastMessageTime: Date.now(),
        timeoutId: timeoutId,
        isRecording: true
      });
      
    } catch (err) {
      console.error("Start recording error:", err);
    }
  }

  static async stopRecording(chatJid) {
    try {
      if (!autoRecordingConfig.activeRecorders.has(chatJid)) {
        return;
      }
      
      const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
      const sock = autoRecordingConfig.botSock;
      
      // Clean up
      clearInterval(recorderData.intervalId);
      if (recorderData.timeoutId) {
        clearTimeout(recorderData.timeoutId);
      }
      
      autoRecordingConfig.activeRecorders.delete(chatJid);
      
      // Stop recording indicator
      try {
        await sock.sendPresenceUpdate('paused', chatJid);
      } catch (err) {
        // Ignore stop errors
      }
      
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  }

  // Check if user is authorized to use the command
  static isAuthorized(msg, extra = {}) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    
    if (msg.key.fromMe) return true;
    
    if (autoRecordingConfig.ownerOnly) {
      if (extra.jidManager) {
        return extra.jidManager.isOwner(msg);
      }
      return false;
    }
    
    if (autoRecordingConfig.allowedUsers.has(senderJid)) {
      return true;
    }
    
    if (extra.jidManager) {
      return extra.jidManager.isOwner(msg);
    }
    
    return false;
  }

  static toggle() {
    autoRecordingConfig.enabled = !autoRecordingConfig.enabled;
    console.log(`🦊 Auto-recording ${autoRecordingConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!autoRecordingConfig.enabled) {
      this.clearAllRecorders();
    }
    
    return autoRecordingConfig.enabled;
  }

  static status() {
    return {
      enabled: autoRecordingConfig.enabled,
      duration: autoRecordingConfig.duration,
      activeSessions: autoRecordingConfig.activeRecorders.size,
      isHooked: autoRecordingConfig.isHooked,
      ownerOnly: autoRecordingConfig.ownerOnly,
      totalUsersRecording: this.getTotalUsersRecording()
    };
  }

  static getTotalUsersRecording() {
    let total = 0;
    autoRecordingConfig.activeRecorders.forEach(recorderData => {
      total += recorderData.userCount;
    });
    return total;
  }

  static setDuration(seconds) {
    if (seconds >= 1 && seconds <= 120) {
      autoRecordingConfig.duration = seconds;
      return true;
    }
    return false;
  }

  static toggleOwnerOnly() {
    autoRecordingConfig.ownerOnly = !autoRecordingConfig.ownerOnly;
    return autoRecordingConfig.ownerOnly;
  }

  static addAllowedUser(jid) {
    autoRecordingConfig.allowedUsers.add(jid);
    return true;
  }

  static removeAllowedUser(jid) {
    autoRecordingConfig.allowedUsers.delete(jid);
    return true;
  }

  static getAllowedUsers() {
    return Array.from(autoRecordingConfig.allowedUsers);
  }

  static clearAllRecorders() {
    autoRecordingConfig.activeRecorders.forEach((recorderData, chatJid) => {
      clearInterval(recorderData.intervalId);
      if (recorderData.timeoutId) {
        clearTimeout(recorderData.timeoutId);
      }
    });
    autoRecordingConfig.activeRecorders.clear();
  }

  static async manualRecording(sock, chatJid, duration, quotedMsg = null) {
    try {
      // Send initial message
      if (quotedMsg) {
        await sock.sendMessage(chatJid, {
          text: `🎤 *Foxy is recording...* 🦊\n\nI'll show 'recording...' for ${duration} seconds!`
        }, { quoted: quotedMsg });
      }
      
      // Start recording indicator
      await sock.sendPresenceUpdate('recording', chatJid);
      
      let isRecording = true;
      
      // Function to keep recording alive
      const keepRecordingAlive = async () => {
        if (isRecording) {
          await sock.sendPresenceUpdate('recording', chatJid);
        }
      };
      
      // Keep refreshing the recording indicator every 2 seconds
      const recordingInterval = setInterval(keepRecordingAlive, 2000);
      
      // Store this manual recording session
      const sessionKey = `manual_${chatJid}_${Date.now()}`;
      autoRecordingConfig.activeRecorders.set(sessionKey, {
        intervalId: recordingInterval,
        userCount: 1,
        startTime: Date.now(),
        isManual: true
      });
      
      // Stop after specified duration
      return new Promise((resolve) => {
        const manualTimeout = setTimeout(async () => {
          isRecording = false;
          
          if (autoRecordingConfig.activeRecorders.has(sessionKey)) {
            clearInterval(autoRecordingConfig.activeRecorders.get(sessionKey).intervalId);
            autoRecordingConfig.activeRecorders.delete(sessionKey);
            
            // Stop recording indicator
            await sock.sendPresenceUpdate('paused', chatJid);
            
            // Send completion message
            if (quotedMsg) {
              await sock.sendMessage(chatJid, {
                text: `✅ *Recording complete!* 🦊\n\nFoxy was recording for ${duration} seconds!`
              }, { quoted: quotedMsg });
            }
          }
          
          resolve();
        }, duration * 1000);
        
        // Store timeout ID
        const recorderData = autoRecordingConfig.activeRecorders.get(sessionKey);
        recorderData.timeoutId = manualTimeout;
        autoRecordingConfig.activeRecorders.set(sessionKey, recorderData);
      });
      
    } catch (err) {
      console.error("Manual recording error:", err);
      throw err;
    }
  }
}

// Main Command Export
export default {
  name: "autorecording",
  alias: ["record", "recording", "voicerec", "audiorec", "rec", "recsim", "foxyrecord"], // Added foxyrecord alias
  desc: "Toggle auto fake recording when someone messages you 🎤🦊",
  category: "owner",
  ownerOnly: true,
  usage: ".autorecording [on/off/duration/status/mode/users/help]\nExample: .autorecording on\nExample: .autorecording 30\nExample: .autorecording status",
  
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
          `Only the bot owner can use auto recording commands.\n` +
          `This feature controls automatic voice recording indicators.`
        );
      }
      // ==================== END OWNER CHECK ====================
      
      // Initialize on first command use
      if (!autoRecordingConfig.isHooked) {
        autoRecordingConfig.botSock = sock;
        AutoRecordingManager.hookIntoBot();
        autoRecordingConfig.isHooked = true;
        console.log('🦊 Auto-recording system initialized!');
      }
      
      if (args.length === 0) {
        // Show status
        const status = AutoRecordingManager.status();
        const statusText = status.enabled ? "✅ *ACTIVE* 🎤" : "❌ *INACTIVE*";
        const modeText = status.ownerOnly ? "🔒 *Owner Only*" : "🌍 *Public Mode*";
        
        await sendMessage(
          `🎤 *Foxy Auto Recording* 🦊\n\n` +
          `*Status:* ${statusText}\n` +
          `*Duration:* ${status.duration} seconds\n` +
          `*Mode:* ${modeText}\n` +
          `*Active Chats:* ${status.activeSessions}\n` +
          `*Total Recording:* ${status.totalUsersRecording} users\n\n` +
          `📋 *Commands:*\n` +
          `• \`${PREFIX}autorecording on\` - Enable auto recording\n` +
          `• \`${PREFIX}autorecording off\` - Disable auto recording\n` +
          `• \`${PREFIX}autorecording 30\` - Set duration to 30s\n` +
          `• \`${PREFIX}autorecording status\` - Detailed status\n` +
          `• \`${PREFIX}autorecording help\` - Show all commands`
        );
        return;
      }
      
      const arg = args[0].toLowerCase();
      
      // Show detailed status
      if (arg === 'status' || arg === 'info' || arg === 'stats') {
        const status = AutoRecordingManager.status();
        const allowedUsers = AutoRecordingManager.getAllowedUsers();
        
        let statusMsg = `🎤 *Foxy Auto Recording Status* 🦊\n\n`;
        statusMsg += `📊 *System Status:*\n`;
        statusMsg += `├◆ Enabled: ${status.enabled ? '✅ YES 🎤' : '❌ NO'}\n`;
        statusMsg += `├◆ Duration: ${status.duration} seconds\n`;
        statusMsg += `├◆ Mode: ${status.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}\n`;
        statusMsg += `├◆ Active Chats: ${status.activeSessions}\n`;
        statusMsg += `├◆ Total Users Recording: ${status.totalUsersRecording}\n`;
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
          statusMsg += `🎙️ *Active Recording Sessions:*\n`;
          autoRecordingConfig.activeRecorders.forEach((data, chatJid) => {
            const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
            const remaining = Math.max(0, status.duration - elapsed);
            statusMsg += `├◆ ${chatJid.includes('@g.us') ? '👥 Group' : '👤 DM'}\n`;
            statusMsg += `│  ├◆ Users: ${data.userCount}\n`;
            statusMsg += `│  ├◆ Elapsed: ${elapsed}s\n`;
            statusMsg += `│  └─ Remaining: ${remaining}s\n`;
          });
        }
        
        statusMsg += `\n💡 Foxy is listening and recording... 🦊🎤`;
        
        return await sendMessage(statusMsg);
      }
      
      // Toggle on/off
      if (arg === 'on' || arg === 'enable' || arg === 'start' || arg === 'activate') {
        const enabled = AutoRecordingManager.toggle();
        
        // Log the action
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`🦊 Auto-recording ${enabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *Auto Recording ${enabled ? 'ENABLED' : 'DISABLED'}* 🎤🦊\n\n` +
          `${enabled ? 
            'Foxy will now automatically show recording when someone messages you! 🦊👂\n\n' +
            '*How it works:*\n' +
            '• When someone sends a non-command message\n' +
            '• Foxy shows recording indicator (mic icon)\n' +
            '• Lasts for ' + autoRecordingConfig.duration + ' seconds\n' +
            '• Works in both DMs and groups' :
            'Foxy has stopped auto recording.\nI will no longer show recording indicators.'}\n\n` +
          `⚙️ *Current Settings:*\n` +
          `• Duration: ${autoRecordingConfig.duration}s\n` +
          `• Mode: ${autoRecordingConfig.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}`
        );
        return;
      }
      
      if (arg === 'off' || arg === 'disable' || arg === 'stop' || arg === 'deactivate') {
        const enabled = AutoRecordingManager.toggle();
        
        // Log the action
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`🦊 Auto-recording ${enabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `${enabled ? '✅ Enabled' : '❌ Disabled'} *Auto Recording* 🎤🦊\n\n` +
          `${enabled ? 
            'Foxy is now auto recording again!' :
            'Foxy has stopped all recording indicators.\n' +
            'No more "recording..." will be shown automatically.'}\n\n` +
          `Use \`${PREFIX}autorecording on\` to enable again.`
        );
        return;
      }
      
      // Mode toggle (owner-only vs public)
      if (arg === 'mode' || arg === 'togglemode' || arg === 'access') {
        const ownerOnly = AutoRecordingManager.toggleOwnerOnly();
        
        await sendMessage(
          `🔧 *Recording Mode Changed* 🦊\n\n` +
          `*New Mode:* ${ownerOnly ? '🔒 *OWNER ONLY*' : '🌍 *PUBLIC ACCESS*'}\n\n` +
          `${ownerOnly ? 
            'Only you (owner) can control auto-recording now.\n' +
            'All other users will be blocked.' : 
            'Public mode enabled!\n' +
            'Anyone can use auto-recording commands now.\n\n' +
            '⚠️ *Warning:* This may allow spam!'}\n\n` +
          `⚙️ *User Management:*\n` +
          `• \`${PREFIX}autorecording users add @user\`\n` +
          `• \`${PREFIX}autorecording users list\`\n` +
          `• \`${PREFIX}autorecording users remove @user\``
        );
        return;
      }
      
      // User management
      if (arg === 'users' || arg === 'user' || arg === 'allow' || arg === 'permit') {
        const subCmd = args[1]?.toLowerCase();
        
        if (!subCmd || subCmd === 'list') {
          const allowedUsers = AutoRecordingManager.getAllowedUsers();
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
          userList += `• \`${PREFIX}autorecording users add @user\`\n`;
          userList += `• \`${PREFIX}autorecording users remove @user\`\n`;
          userList += `• \`${PREFIX}autorecording users clear\``;
          
          return await sendMessage(userList);
        }
        
        if (subCmd === 'add' && args[2]) {
          const userToAdd = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoRecordingManager.addAllowedUser(userToAdd);
          
          const cleanUser = userToAdd.split('@')[0];
          
          await sendMessage(
            `✅ *User Added* 🦊\n\n` +
            `Added ${cleanUser} to allowed users list.\n\n` +
            `They can now use auto-recording commands when in public mode.\n` +
            `Current mode: ${autoRecordingConfig.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}`
          );
          return;
        }
        
        if (subCmd === 'remove' && args[2]) {
          const userToRemove = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoRecordingManager.removeAllowedUser(userToRemove);
          
          const cleanUser = userToRemove.split('@')[0];
          
          await sendMessage(
            `✅ *User Removed* 🦊\n\n` +
            `Removed ${cleanUser} from allowed users list.\n\n` +
            `They can no longer use auto-recording commands.`
          );
          return;
        }
        
        if (subCmd === 'clear') {
          autoRecordingConfig.allowedUsers.clear();
          
          await sendMessage(
            `✅ *Users Cleared* 🦊\n\n` +
            `All allowed users have been removed.\n` +
            `Only you (owner) can use auto-recording commands now.`
          );
          return;
        }
        
        // Invalid user command
        await sendMessage(
          `❓ *Invalid User Command*\n\n` +
          `*Usage:*\n` +
          `• \`${PREFIX}autorecording users list\`\n` +
          `• \`${PREFIX}autorecording users add @user\`\n` +
          `• \`${PREFIX}autorecording users remove @user\`\n` +
          `• \`${PREFIX}autorecording users clear\``
        );
        return;
      }
      
      // Set duration
      const duration = parseInt(arg);
      if (!isNaN(duration) && duration >= 1 && duration <= 120) {
        const success = AutoRecordingManager.setDuration(duration);
        if (success) {
          await sendMessage(
            `✅ *Duration Updated* 🦊\n\n` +
            `Recording duration set to ${duration} seconds.\n\n` +
            `${AutoRecordingManager.status().enabled ? '🎤 Foxy is currently **AUTO RECORDING**' : '💤 Foxy is **SILENT** (not recording)'}\n` +
            `• Mode: ${AutoRecordingManager.status().ownerOnly ? '🔒 Owner Only' : '🌍 Public'}\n` +
            `• Active Chats: ${AutoRecordingManager.status().activeSessions}`
          );
        } else {
          await sendMessage(
            `❌ *Invalid Duration* 🦊\n\n` +
            `Please use a number between 1 and 120 seconds.\n\n` +
            `*Maximum recording time:* 2 minutes (120 seconds)\n` +
            `*Recommended:* 5-30 seconds\n` +
            `*Current setting:* ${autoRecordingConfig.duration}s`
          );
        }
        return;
      }
      
      // Manual recording command
      if (arg === 'test' || arg === 'demo' || arg === 'manual' || arg === 'now') {
        const manualDuration = args[1] ? parseInt(args[1]) : autoRecordingConfig.duration;
        
        if (isNaN(manualDuration) || manualDuration < 1 || manualDuration > 120) {
          await sendMessage(
            `❌ *Invalid Duration* 🦊\n\n` +
            `Please use a number between 1 and 120 seconds.\n\n` +
            `Usage: \`${PREFIX}autorecording test 15\``
          );
          return;
        }
        
        await sendMessage(
          `🎤 *Starting Recording Test...* 🦊\n\n` +
          `Foxy will show recording for ${manualDuration} seconds...`
        );
        
        // Do manual recording
        await AutoRecordingManager.manualRecording(sock, chatId, manualDuration, m);
        
        return;
      }
      
      // Help command
      if (arg === 'help' || arg === 'cmd' || arg === 'guide') {
        await sendMessage(
          `📖 *FOXY AUTO RECORDING HELP* 🦊🎤\n\n` +
          `*Basic Commands:*\n` +
          `• \`${PREFIX}autorecording\` - Show status\n` +
          `• \`${PREFIX}autorecording on\` - Enable auto recording\n` +
          `• \`${PREFIX}autorecording off\` - Disable auto recording\n` +
          `• \`${PREFIX}autorecording 30\` - Set duration to 30s\n\n` +
          `*Advanced Control:*\n` +
          `• \`${PREFIX}autorecording mode\` - Toggle owner-only/public mode\n` +
          `• \`${PREFIX}autorecording status\` - Detailed status info\n` +
          `• \`${PREFIX}autorecording test 15\` - Test recording for 15s\n\n` +
          `*User Management:*\n` +
          `• \`${PREFIX}autorecording users list\` - Show allowed users\n` +
          `• \`${PREFIX}autorecording users add @user\` - Allow user\n` +
          `• \`${PREFIX}autorecording users remove @user\` - Remove user\n\n` +
          `*Examples:*\n` +
          `\`${PREFIX}autorecording on\`\n` +
          `\`${PREFIX}autorecording 15\`\n` +
          `\`${PREFIX}autorecording status\`\n\n` +
          `⚠️ *Note:* Recording indicators can show in multiple chats!`
        );
        return;
      }
      
      // If no valid command, show help
      await sendMessage(
        `❓ *Invalid Command* 🦊\n\n` +
        `*Available commands:*\n` +
        `• \`${PREFIX}autorecording on/off\`\n` +
        `• \`${PREFIX}autorecording <1-120>\` (set duration)\n` +
        `• \`${PREFIX}autorecording status\`\n` +
        `• \`${PREFIX}autorecording help\`\n\n` +
        `Type \`${PREFIX}autorecording help\` for full command list.`
      );
      
    } catch (err) {
      console.error("AutoRecording command error:", err);
      await sendMessage(
        `❌ *Command Failed* 🦊\n\n` +
        `Error: ${err.message}\n` +
        `Try again or check the command syntax.`
      );
    }
  }
};
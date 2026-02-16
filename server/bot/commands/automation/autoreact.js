// commands/owner/autoreact.js

// AutoReact Manager (State Management)
const autoReactConfig = {
  enabled: false, // OFF by default
  emoji: "🦊", // Single emoji for reaction (changed from 😂 to 🦊)
  reactToDMs: true,
  reactToGroups: true,
  reactToCommands: false,
  activeReactions: new Set(), // Track messages we've reacted to
  botSock: null,
  isHooked: false,
  ownerOnly: true,
  allowedUsers: new Set(),
  maxReactionsPerMinute: 30,
  reactionTimestamps: [],
  cooldown: 1000, // 1 second cooldown per user
  userCooldowns: new Map()
};

class AutoReactManager {
  static initialize(sock) {
    if (!autoReactConfig.isHooked && sock) {
      autoReactConfig.botSock = sock;
      this.hookIntoBot();
      autoReactConfig.isHooked = true;
      console.log('🦊 Auto-react system initialized (off by default)!');
    }
  }

  static hookIntoBot() {
    if (!autoReactConfig.botSock || !autoReactConfig.botSock.ev) {
      console.log('⚠️ Could not hook into bot events');
      return;
    }
    
    // Add our handler alongside existing ones
    autoReactConfig.botSock.ev.on('messages.upsert', async (data) => {
      await this.handleIncomingMessage(data);
    });
    
    console.log('✅ Auto-react successfully hooked into message events');
  }

  // Check rate limiting
  static isRateLimited() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old timestamps
    autoReactConfig.reactionTimestamps = autoReactConfig.reactionTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    // Check if we've reached the limit
    if (autoReactConfig.reactionTimestamps.length >= autoReactConfig.maxReactionsPerMinute) {
      return true;
    }
    
    // Add current timestamp
    autoReactConfig.reactionTimestamps.push(now);
    return false;
  }

  // Check user cooldown
  static isUserOnCooldown(userJid) {
    const now = Date.now();
    const lastReaction = autoReactConfig.userCooldowns.get(userJid);
    
    if (!lastReaction) return false;
    
    if (now - lastReaction < autoReactConfig.cooldown) {
      return true;
    }
    
    return false;
  }

  static async handleIncomingMessage(data) {
    try {
      if (!data || !data.messages || data.messages.length === 0) return;
      
      const m = data.messages[0];
      const sock = autoReactConfig.botSock;
      
      // CRITICAL FIX: Check if auto-react is enabled FIRST
      if (!autoReactConfig.enabled) {
        return;
      }
      
      // Check if message exists and skip if it's from the bot itself
      if (!m || !m.key || m.key.fromMe) return;
      
      const userJid = m.key.participant || m.key.remoteJid;
      const chatJid = m.key.remoteJid;
      const messageKey = m.key;
      
      if (!userJid || !chatJid || !messageKey) return;
      
      // Check if we already reacted to this message
      const messageId = `${chatJid}_${messageKey.id}`;
      if (autoReactConfig.activeReactions.has(messageId)) {
        return;
      }
      
      // Check user cooldown
      if (this.isUserOnCooldown(userJid)) {
        return;
      }
      
      // Check if it's a DM or Group
      const isGroup = chatJid.includes('@g.us');
      const isDM = !isGroup;
      
      // Check if we should react based on settings
      if (isDM && !autoReactConfig.reactToDMs) return;
      if (isGroup && !autoReactConfig.reactToGroups) return;
      
      // Get message text from various message types
      let messageText = '';
      if (m.message) {
        if (m.message.conversation) {
          messageText = m.message.conversation;
        } else if (m.message.extendedTextMessage?.text) {
          messageText = m.message.extendedTextMessage.text;
        } else if (m.message.imageMessage?.caption) {
          messageText = m.message.imageMessage.caption || '';
        } else if (m.message.videoMessage?.caption) {
          messageText = m.message.videoMessage.caption || '';
        }
      }
      
      // Check if it's a command (starts with prefix)
      if (messageText.trim().startsWith('.') && !autoReactConfig.reactToCommands) {
        return;
      }
      
      // Rate limiting check
      if (this.isRateLimited()) {
        console.log('⚠️ Rate limited: Too many reactions per minute');
        return;
      }
      
      // React to the message
      try {
        // CRITICAL FIX: Use the correct reaction format
        await sock.sendMessage(chatJid, {
          react: {
            text: autoReactConfig.emoji,
            key: messageKey
          }
        });
        
        // Mark as reacted and update cooldown
        autoReactConfig.activeReactions.add(messageId);
        autoReactConfig.userCooldowns.set(userJid, Date.now());
        
        console.log(`🦊 Reacted with ${autoReactConfig.emoji} to message from ${userJid}`);
        
        // Clean up after some time (5 minutes)
        setTimeout(() => {
          autoReactConfig.activeReactions.delete(messageId);
        }, 5 * 60 * 1000);
        
        // Clean old cooldowns periodically
        setTimeout(() => {
          const now = Date.now();
          autoReactConfig.userCooldowns.forEach((timestamp, key) => {
            if (now - timestamp > 60000) { // 1 minute
              autoReactConfig.userCooldowns.delete(key);
            }
          });
        }, 60000);
        
      } catch (err) {
        console.error("Failed to react to message:", err.message || err);
      }
      
    } catch (err) {
      console.error("Auto-react handler error:", err.message || err);
    }
  }

  // Check if user is authorized to use the command
  static isAuthorized(msg, extra = {}) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    
    // Check if fromMe (bot itself)
    if (msg.key.fromMe) return true;
    
    // Check if owner only mode is enabled
    if (autoReactConfig.ownerOnly) {
      // Use the owner check logic from your jidManager
      if (extra.jidManager) {
        return extra.jidManager.isOwner(msg);
      }
      return false;
    }
    
    // If not owner-only, check allowed users
    if (autoReactConfig.allowedUsers.has(senderJid)) {
      return true;
    }
    
    // Check if it's the owner using the jidManager
    if (extra.jidManager) {
      return extra.jidManager.isOwner(msg);
    }
    
    return false;
  }

  static toggle() {
    autoReactConfig.enabled = !autoReactConfig.enabled;
    console.log(`🦊 Auto-react ${autoReactConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
    return autoReactConfig.enabled;
  }

  static status() {
    return {
      enabled: autoReactConfig.enabled,
      emoji: autoReactConfig.emoji,
      reactToDMs: autoReactConfig.reactToDMs,
      reactToGroups: autoReactConfig.reactToGroups,
      reactToCommands: autoReactConfig.reactToCommands,
      ownerOnly: autoReactConfig.ownerOnly,
      isHooked: autoReactConfig.isHooked,
      activeReactions: autoReactConfig.activeReactions.size,
      userCooldowns: autoReactConfig.userCooldowns.size,
      rateLimit: `${autoReactConfig.reactionTimestamps.length}/${autoReactConfig.maxReactionsPerMinute} reactions/min`
    };
  }

  static setEmoji(emoji) {
    // Basic emoji validation
    if (emoji && emoji.length <= 5) {
      autoReactConfig.emoji = emoji;
      return true;
    }
    return false;
  }

  static toggleDMs() {
    autoReactConfig.reactToDMs = !autoReactConfig.reactToDMs;
    return autoReactConfig.reactToDMs;
  }

  static toggleGroups() {
    autoReactConfig.reactToGroups = !autoReactConfig.reactToGroups;
    return autoReactConfig.reactToGroups;
  }

  static toggleCommands() {
    autoReactConfig.reactToCommands = !autoReactConfig.reactToCommands;
    return autoReactConfig.reactToCommands;
  }

  static toggleOwnerOnly() {
    autoReactConfig.ownerOnly = !autoReactConfig.ownerOnly;
    return autoReactConfig.ownerOnly;
  }

  static setBoth() {
    autoReactConfig.reactToDMs = true;
    autoReactConfig.reactToGroups = true;
    return { dms: true, groups: true };
  }

  static setDMsOnly() {
    autoReactConfig.reactToDMs = true;
    autoReactConfig.reactToGroups = false;
    return { dms: true, groups: false };
  }

  static setGroupsOnly() {
    autoReactConfig.reactToDMs = false;
    autoReactConfig.reactToGroups = true;
    return { dms: false, groups: true };
  }

  static addAllowedUser(jid) {
    autoReactConfig.allowedUsers.add(jid);
    return true;
  }

  static removeAllowedUser(jid) {
    autoReactConfig.allowedUsers.delete(jid);
    return true;
  }

  static getAllowedUsers() {
    return Array.from(autoReactConfig.allowedUsers);
  }

  static clearAllReactions() {
    autoReactConfig.activeReactions.clear();
    autoReactConfig.userCooldowns.clear();
    autoReactConfig.reactionTimestamps = [];
  }

  // Manual reaction to a specific message
  static async manualReact(sock, chatJid, emoji, messageKey) {
    try {
      if (!messageKey || !messageKey.id) {
        throw new Error("Invalid message key");
      }
      
      await sock.sendMessage(chatJid, {
        react: {
          text: emoji || autoReactConfig.emoji,
          key: messageKey
        }
      });
      
      const messageId = `${chatJid}_${messageKey.id}`;
      autoReactConfig.activeReactions.add(messageId);
      
      return true;
    } catch (err) {
      console.error("Manual reaction error:", err.message || err);
      return false;
    }
  }

  // React to quoted message
  static async reactToQuoted(sock, chatJid, quotedMsg, emoji) {
    if (!quotedMsg || !quotedMsg.key) {
      throw new Error("No quoted message found");
    }
    
    try {
      await sock.sendMessage(chatJid, {
        react: {
          text: emoji || autoReactConfig.emoji,
          key: quotedMsg.key
        }
      });
      return true;
    } catch (err) {
      console.error("React to quoted error:", err);
      throw err;
    }
  }
}

// Main Command Export
export default {
  name: "autoreact",
  alias: ["autoreaction", "reactauto", "autoemoji", "react", "foxyreactmsg"], // Added foxyreactmsg alias
  desc: "Auto-react to messages with emojis 🦊",
  category: "owner",
  ownerOnly: true,
  usage: ".autoreact [on/off/set/dms/groups/both/status/mode/users/test/clear/help]\nExample: .autoreact on\nExample: .autoreact set 🦊\nExample: .autoreact test",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    const isGroup = chatId.includes('@g.us');
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      // ==================== OWNER CHECK ====================
      const isOwner = jidManager.isOwner(m);
      
      if (!isOwner) {
        return await sendMessage(
          `❌ *Owner Only Command!* 🦊\n\n` +
          `Only the bot owner can use auto-react commands.\n` +
          `This feature controls automatic message reactions.\n\n` +
          `*Current Status:* ${autoReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
          `*Emoji:* ${autoReactConfig.emoji}`
        );
      }
      // ==================== END OWNER CHECK ====================
      
      // Initialize on first command use
      if (!autoReactConfig.isHooked) {
        AutoReactManager.initialize(sock);
        console.log('🦊 Auto-react system initialized!');
      }
      
      if (args.length === 0) {
        // Show status
        const status = AutoReactManager.status();
        const statusText = status.enabled ? "✅ *ENABLED*" : "❌ *DISABLED*";
        const dmStatus = status.reactToDMs ? "✅ DMs" : "❌ DMs";
        const groupStatus = status.reactToGroups ? "✅ Groups" : "❌ Groups";
        const cmdStatus = status.reactToCommands ? "✅ Commands" : "❌ Commands";
        
        await sendMessage(
          `🦊 *FOXY AUTO REACT*\n\n` +
          `${statusText} (Off by default)\n\n` +
          `*Current Settings:*\n` +
          `• Status: ${status.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
          `• Emoji: ${status.emoji}\n` +
          `• DMs: ${dmStatus}\n` +
          `• Groups: ${groupStatus}\n` +
          `• Commands: ${cmdStatus}\n` +
          `• Rate Limit: ${status.rateLimit}\n\n` +
          `📋 *Commands:*\n` +
          `• \`${PREFIX}autoreact on\` - Enable\n` +
          `• \`${PREFIX}autoreact off\` - Disable\n` +
          `• \`${PREFIX}autoreact set <emoji>\`\n` +
          `• \`${PREFIX}autoreact dms\`\n` +
          `• \`${PREFIX}autoreact groups\`\n` +
          `• \`${PREFIX}autoreact both\`\n` +
          `• \`${PREFIX}autoreact help\` - Full help`
        );
        return;
      }
      
      const arg = args[0].toLowerCase();
      
      // Log the action
      const senderJid = m.key.participant || chatId;
      const cleaned = jidManager.cleanJid(senderJid);
      
      // Show detailed status
      if (arg === 'status' || arg === 'info' || arg === 'stats') {
        const status = AutoReactManager.status();
        const allowedUsers = AutoReactManager.getAllowedUsers();
        
        let statusMsg = `🦊 *FOXY AUTO REACT STATUS*\n\n`;
        statusMsg += `*System Status:*\n`;
        statusMsg += `├─ Enabled: ${status.enabled ? '✅ YES 🦊' : '❌ NO (Default OFF)'}\n`;
        statusMsg += `├─ Current Emoji: ${status.emoji}\n`;
        statusMsg += `├─ React to DMs: ${status.reactToDMs ? '✅ YES' : '❌ NO'}\n`;
        statusMsg += `├─ React to Groups: ${status.reactToGroups ? '✅ YES' : '❌ NO'}\n`;
        statusMsg += `├─ React to Commands: ${status.reactToCommands ? '✅ YES' : '❌ NO'}\n`;
        statusMsg += `├─ Active Reactions: ${status.activeReactions}\n`;
        statusMsg += `├─ Rate Limit: ${status.rateLimit}\n`;
        statusMsg += `├─ User Cooldowns: ${status.userCooldowns}\n`;
        statusMsg += `└─ System Hooked: ${status.isHooked ? '✅' : '❌'}\n\n`;
        
        statusMsg += `⚙️ *Default Settings:*\n`;
        statusMsg += `• Enabled: ❌ OFF (by default)\n`;
        statusMsg += `• DMs: ✅ ON (when enabled)\n`;
        statusMsg += `• Groups: ✅ ON (when enabled)\n`;
        statusMsg += `• Commands: ❌ OFF\n\n`;
        
        if (allowedUsers.length > 0 && !status.ownerOnly) {
          statusMsg += `👥 *Allowed Users:*\n`;
          allowedUsers.forEach((user, index) => {
            const cleanUser = user.split('@')[0];
            statusMsg += `${index + 1}. ${cleanUser}\n`;
          });
          statusMsg += `\n`;
        }
        
        statusMsg += `💡 *Popular Emojis:*\n`;
        statusMsg += `🦊 ❤️ 👍 😂 😍 🎉 🔥 😎 👏 💯\n`;
        statusMsg += `😊 🥰 😘 🙏 ✨ 💪 😁 🚀 🎯\n\n`;
        statusMsg += `Use \`${PREFIX}autoreact set <emoji>\` to change`;
        
        return await sendMessage(statusMsg);
      }
      
      // Toggle on/off
      if (arg === 'on' || arg === 'enable' || arg === 'start') {
        autoReactConfig.enabled = true;
        
        console.log(`🦊 Auto-react enabled by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *AUTO REACT ENABLED* 🦊\n\n` +
          `Foxy will now automatically react to messages!\n\n` +
          `*Current Settings:*\n` +
          `• Status: 🟢 ON\n` +
          `• Emoji: ${autoReactConfig.emoji}\n` +
          `• DMs: ${autoReactConfig.reactToDMs ? '✅ ON' : '❌ OFF'}\n` +
          `• Groups: ${autoReactConfig.reactToGroups ? '✅ ON' : '❌ OFF'}\n` +
          `• Commands: ${autoReactConfig.reactToCommands ? '✅ ON' : '❌ OFF'}\n\n` +
          `*Note:* Reacts to both DMs and groups by default.\n` +
          `Use \`${PREFIX}autoreact dms\` or \`${PREFIX}autoreact groups\` to toggle.`
        );
        return;
      }
      
      if (arg === 'off' || arg === 'disable' || arg === 'stop') {
        autoReactConfig.enabled = false;
        
        console.log(`🦊 Auto-react disabled by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `❌ *AUTO REACT DISABLED* 🦊\n\n` +
          `Foxy will no longer auto-react to messages.\n\n` +
          `Use \`${PREFIX}autoreact on\` to enable again.\n` +
          `Foxy is resting... 😴`
        );
        return;
      }
      
      // Set emoji
      if (arg === 'set' || arg === 'emoji') {
        if (!args[1]) {
          return await sendMessage(
            `❌ *Missing Emoji* 🦊\n\n` +
            `*Usage:* \`${PREFIX}autoreact set <emoji>\`\n\n` +
            `*Examples:*\n` +
            `• \`${PREFIX}autoreact set 🦊\`\n` +
            `• \`${PREFIX}autoreact set ❤️\`\n` +
            `• \`${PREFIX}autoreact set 👍\`\n\n` +
            `*Popular Emojis:*\n` +
            `🦊 ❤️ 👍 😂 😍 🎉 🔥 😎 👏 💯`
          );
        }
        
        const emoji = args[1];
        const success = AutoReactManager.setEmoji(emoji);
        
        if (success) {
          console.log(`🦊 Auto-react emoji set to '${emoji}' by: ${cleaned.cleanNumber || 'Owner'}`);
          
          await sendMessage(
            `✅ *Emoji Updated* 🦊\n\n` +
            `New reaction emoji: ${emoji}\n\n` +
            `Foxy will now react with ${emoji} to messages!\n` +
            `Auto-react status: ${autoReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}`
          );
        } else {
          await sendMessage(
            `❌ *Invalid Emoji* 🦊\n\n` +
            `Please use a valid single emoji.\n\n` +
            `*Examples:* 🦊, ❤️, 👍, 🎉\n` +
            `*Note:* Some custom emojis may not work.`
          );
        }
        return;
      }
      
      // Toggle DMs
      if (arg === 'dms' || arg === 'dm') {
        const dmsEnabled = AutoReactManager.toggleDMs();
        
        console.log(`🦊 Auto-react DMs ${dmsEnabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `💬 *DM Reactions ${dmsEnabled ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
          `${dmsEnabled ? 'Foxy will react to messages in DMs! 💬' : 'Foxy will NOT react to messages in DMs.'}\n\n` +
          `*Current Settings:*\n` +
          `• DMs: ${dmsEnabled ? '✅ ON' : '❌ OFF'}\n` +
          `• Groups: ${autoReactConfig.reactToGroups ? '✅ ON' : '❌ OFF'}\n` +
          `• Both: ${dmsEnabled && autoReactConfig.reactToGroups ? '✅ YES' : '❌ NO'}\n\n` +
          `⚠️ *Note:* Auto-react must be enabled with \`${PREFIX}autoreact on\``
        );
        return;
      }
      
      // Toggle groups
      if (arg === 'groups' || arg === 'group') {
        const groupsEnabled = AutoReactManager.toggleGroups();
        
        console.log(`🦊 Auto-react groups ${groupsEnabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `👥 *Group Reactions ${groupsEnabled ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
          `${groupsEnabled ? 'Foxy will react to messages in groups! 👥' : 'Foxy will NOT react to messages in groups.'}\n\n` +
          `*Current Settings:*\n` +
          `• DMs: ${autoReactConfig.reactToDMs ? '✅ ON' : '❌ OFF'}\n` +
          `• Groups: ${groupsEnabled ? '✅ ON' : '❌ OFF'}\n` +
          `• Both: ${autoReactConfig.reactToDMs && groupsEnabled ? '✅ YES' : '❌ NO'}\n\n` +
          `⚠️ *Note:* Auto-react must be enabled with \`${PREFIX}autoreact on\``
        );
        return;
      }
      
      // Set both DMs and groups
      if (arg === 'both' || arg === 'all') {
        const both = AutoReactManager.setBoth();
        
        console.log(`🦊 Auto-react set to both DMs & groups by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *Both DMs & Groups Enabled* 🦊\n\n` +
          `Foxy will react to messages in both DMs and groups! 🎉\n\n` +
          `*Current Settings:*\n` +
          `• DMs: ✅ ON\n` +
          `• Groups: ✅ ON\n` +
          `• Commands: ${autoReactConfig.reactToCommands ? '✅ ON' : '❌ OFF'}\n\n` +
          `⚠️ *Note:* Auto-react must be enabled with \`${PREFIX}autoreact on\`\n\n` +
          `Use \`${PREFIX}autoreact dms\` or \`${PREFIX}autoreact groups\` to toggle individually.`
        );
        return;
      }
      
      // Set DMs only
      if (arg === 'dmsonly' || arg === 'onlydms') {
        const settings = AutoReactManager.setDMsOnly();
        
        console.log(`🦊 Auto-react set to DMs only by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *DMs Only Mode* 🦊\n\n` +
          `Foxy will react ONLY to messages in DMs (not groups)! 💬\n\n` +
          `*Current Settings:*\n` +
          `• DMs: ✅ ON\n` +
          `• Groups: ❌ OFF\n` +
          `• Commands: ${autoReactConfig.reactToCommands ? '✅ ON' : '❌ OFF'}\n\n` +
          `⚠️ *Note:* Auto-react must be enabled with \`${PREFIX}autoreact on\``
        );
        return;
      }
      
      // Set groups only
      if (arg === 'groupsonly' || arg === 'onlygroups') {
        const settings = AutoReactManager.setGroupsOnly();
        
        console.log(`🦊 Auto-react set to groups only by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *Groups Only Mode* 🦊\n\n` +
          `Foxy will react ONLY to messages in groups (not DMs)! 👥\n\n` +
          `*Current Settings:*\n` +
          `• DMs: ❌ OFF\n` +
          `• Groups: ✅ ON\n` +
          `• Commands: ${autoReactConfig.reactToCommands ? '✅ ON' : '❌ OFF'}\n\n` +
          `⚠️ *Note:* Auto-react must be enabled with \`${PREFIX}autoreact on\``
        );
        return;
      }
      
      // Toggle command reactions
      if (arg === 'commands' || arg === 'cmds' || arg === 'cmd') {
        const commandsEnabled = AutoReactManager.toggleCommands();
        
        console.log(`🦊 Auto-react commands ${commandsEnabled ? 'enabled' : 'disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `⌨️ *Command Reactions ${commandsEnabled ? 'ENABLED' : 'DISABLED'}* 🦊\n\n` +
          `${commandsEnabled ? 'Foxy will react to command messages too! ⌨️' : 'Foxy will skip reacting to command messages.'}\n\n` +
          `⚠️ *Note:*\n` +
          `1. Auto-react must be enabled with \`${PREFIX}autoreact on\`\n` +
          `2. Reacting to commands may cause confusion\n` +
          `3. Users might think command worked when it's just a reaction`
        );
        return;
      }
      
      // Mode toggle (owner-only vs public)
      if (arg === 'mode' || arg === 'togglemode' || arg === 'access') {
        const ownerOnly = AutoReactManager.toggleOwnerOnly();
        
        console.log(`🦊 Auto-react mode set to ${ownerOnly ? 'owner only' : 'public'} by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `🔧 *React Mode Changed* 🦊\n\n` +
          `*New Mode:* ${ownerOnly ? '🔒 *OWNER ONLY*' : '🌍 *PUBLIC ACCESS*'}\n\n` +
          `${ownerOnly ? 
            'Only you (owner) can control auto-react now.\n' +
            'All other users will be blocked.' : 
            'Public mode enabled!\n' +
            'Anyone can use auto-react commands now.\n\n' +
            '⚠️ *Warning:* This may allow spam!'}\n\n` +
          `⚙️ *User Management:*\n` +
          `• \`${PREFIX}autoreact users add @user\`\n` +
          `• \`${PREFIX}autoreact users list\`\n` +
          `• \`${PREFIX}autoreact users remove @user\`\n\n` +
          `⚠️ *Note:* Auto-react is OFF by default. Enable with \`${PREFIX}autoreact on\``
        );
        return;
      }
      
      // User management
      if (arg === 'users' || arg === 'user' || arg === 'allow' || arg === 'permit') {
        const subCmd = args[1]?.toLowerCase();
        
        if (!subCmd || subCmd === 'list') {
          const allowedUsers = AutoReactManager.getAllowedUsers();
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
          userList += `• \`${PREFIX}autoreact users add @user\`\n`;
          userList += `• \`${PREFIX}autoreact users remove @user\`\n`;
          userList += `• \`${PREFIX}autoreact users clear\``;
          
          return await sendMessage(userList);
        }
        
        if (subCmd === 'add' && args[2]) {
          const userToAdd = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoReactManager.addAllowedUser(userToAdd);
          
          const cleanUser = userToAdd.split('@')[0];
          
          console.log(`🦊 User '${cleanUser}' added to auto-react allowed list by: ${cleaned.cleanNumber || 'Owner'}`);
          
          await sendMessage(
            `✅ *User Added* 🦊\n\n` +
            `Added ${cleanUser} to allowed users list.\n\n` +
            `They can now use auto-react commands when in public mode.\n` +
            `Current mode: ${autoReactConfig.ownerOnly ? '🔒 Owner Only' : '🌍 Public'}`
          );
          return;
        }
        
        if (subCmd === 'remove' && args[2]) {
          const userToRemove = args[2].replace('@', '') + '@s.whatsapp.net';
          AutoReactManager.removeAllowedUser(userToRemove);
          
          const cleanUser = userToRemove.split('@')[0];
          
          console.log(`🦊 User '${cleanUser}' removed from auto-react allowed list by: ${cleaned.cleanNumber || 'Owner'}`);
          
          await sendMessage(
            `✅ *User Removed* 🦊\n\n` +
            `Removed ${cleanUser} from allowed users list.\n\n` +
            `They can no longer use auto-react commands.`
          );
          return;
        }
        
        if (subCmd === 'clear') {
          autoReactConfig.allowedUsers.clear();
          
          console.log(`🦊 Allowed users list cleared by: ${cleaned.cleanNumber || 'Owner'}`);
          
          await sendMessage(
            `✅ *Users Cleared* 🦊\n\n` +
            `All allowed users have been removed.\n` +
            `Only you (owner) can use auto-react commands now.`
          );
          return;
        }
        
        // Invalid user command
        await sendMessage(
          `❓ *Invalid User Command* 🦊\n\n` +
          `*Usage:*\n` +
          `• \`${PREFIX}autoreact users list\`\n` +
          `• \`${PREFIX}autoreact users add @user\`\n` +
          `• \`${PREFIX}autoreact users remove @user\`\n` +
          `• \`${PREFIX}autoreact users clear\``
        );
        return;
      }
      
      // Manual reaction to quoted message
      if ((arg === 'react' || arg === 'manual') && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = m.message.extendedTextMessage.contextInfo;
        const emoji = args[1] || autoReactConfig.emoji;
        
        try {
          // Create message key for the quoted message
          const messageKey = {
            remoteJid: chatId,
            fromMe: false,
            id: quotedMsg.stanzaId,
            participant: quotedMsg.participant || chatId
          };
          
          const success = await AutoReactManager.manualReact(sock, chatId, emoji, messageKey);
          
          if (success) {
            await sendMessage(
              `✅ *Reaction Sent* 🦊\n\n` +
              `Reacted with ${emoji} to the quoted message!\n\n` +
              `Auto-react status: ${autoReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}`
            );
          } else {
            await sendMessage(`❌ *Failed to React* 🦊\n\nCould not react to the quoted message.`);
          }
        } catch (err) {
          await sendMessage(`❌ *Error:* ${err.message || 'Failed to react to quoted message'}`);
        }
        return;
      }
      
      // Test reaction to current message
      if (arg === 'test') {
        try {
          const emoji = args[1] || autoReactConfig.emoji;
          
          // React to the current command message
          await sock.sendMessage(chatId, {
            react: {
              text: emoji,
              key: m.key
            }
          });
          
          await sendMessage(
            `✅ *Test Reaction Sent* 🦊\n\n` +
            `Reacted with ${emoji} to this command!\n\n` +
            `*Auto-react status:* ${autoReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
            `*Emoji:* ${autoReactConfig.emoji}\n` +
            `*DMs:* ${autoReactConfig.reactToDMs ? '✅ ON' : '❌ OFF'}\n` +
            `*Groups:* ${autoReactConfig.reactToGroups ? '✅ ON' : '❌ OFF'}`
          );
        } catch (err) {
          await sendMessage(`❌ *Test Failed:* ${err.message || 'Could not send reaction'}`);
        }
        return;
      }
      
      // Clear all active reactions
      if (arg === 'clear' || arg === 'reset' || arg === 'flush') {
        AutoReactManager.clearAllReactions();
        
        console.log(`🦊 Auto-react tracking cleared by: ${cleaned.cleanNumber || 'Owner'}`);
        
        await sendMessage(
          `✅ *All Reactions Cleared* 🦊\n\n` +
          `Cleared all active reaction tracking and user cooldowns.\n\n` +
          `*Auto-react status:* ${autoReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
          `*Emoji:* ${autoReactConfig.emoji}\n` +
          `Foxy starts fresh! ✨`
        );
        return;
      }
      
      // Help command
      if (arg === 'help' || arg === 'cmd' || arg === 'guide') {
        await sendMessage(
          `📖 *FOXY AUTO REACT HELP* 🦊\n\n` +
          `⚠️ *NOTE:* Auto-react is OFF by default. Enable with \`${PREFIX}autoreact on\`\n\n` +
          `*Basic Control:*\n` +
          `• \`${PREFIX}autoreact on\` - Enable auto-react\n` +
          `• \`${PREFIX}autoreact off\` - Disable auto-react\n` +
          `• \`${PREFIX}autoreact set 🦊\` - Set reaction emoji\n\n` +
          `*Target Control:*\n` +
          `• \`${PREFIX}autoreact dms\` - Toggle DM reactions\n` +
          `• \`${PREFIX}autoreact groups\` - Toggle group reactions\n` +
          `• \`${PREFIX}autoreact both\` - React to both\n` +
          `• \`${PREFIX}autoreact dmsonly\` - Only DMs\n` +
          `• \`${PREFIX}autoreact groupsonly\` - Only groups\n` +
          `• \`${PREFIX}autoreact commands\` - Toggle command reactions\n\n` +
          `*Info & Tools:*\n` +
          `• \`${PREFIX}autoreact\` - Show status\n` +
          `• \`${PREFIX}autoreact status\` - Detailed status\n` +
          `• \`${PREFIX}autoreact test\` - Test reaction\n` +
          `• \`${PREFIX}autoreact clear\` - Clear tracking\n\n` +
          `*Manual Reaction:*\n` +
          `Reply to message with: \`${PREFIX}autoreact react 🦊\`\n\n` +
          `⚠️ *Rate Limit:* ${autoReactConfig.maxReactionsPerMinute} reactions per minute\n` +
          `⚙️ *Defaults:* OFF | DMs ✅ | Groups ✅ | Commands ❌`
        );
        return;
      }
      
      // If no valid command, show help
      await sendMessage(
        `❓ *Invalid Command* 🦊\n\n` +
        `*Available commands:*\n` +
        `• \`${PREFIX}autoreact on/off\`\n` +
        `• \`${PREFIX}autoreact set <emoji>\`\n` +
        `• \`${PREFIX}autoreact dms/groups/both\`\n` +
        `• \`${PREFIX}autoreact status\`\n` +
        `• \`${PREFIX}autoreact help\`\n\n` +
        `Type \`${PREFIX}autoreact help\` for full command list.`
      );
      
    } catch (err) {
      console.error("🦊 AutoReact command error:", err);
      await sendMessage(
        `❌ *Command Failed* 🦊\n\n` +
        `Error: ${err.message}\n` +
        `Try again or check the settings.`
      );
    }
  }
};
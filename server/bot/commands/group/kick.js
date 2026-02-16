export default {
  name: 'kick',
  alias: ['remove', 'ban'],
  category: 'group',
  description: 'Remove member from group',
  
  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { 
        text: '❌ Groups only.' 
      }, { quoted: msg });
      return;
    }

    const groupMetadata = await sock.groupMetadata(jid);
    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
    
    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: '🛑 Admin only.' 
      }, { quoted: msg });
      return;
    }

    // Get target - UPDATED TO HANDLE REPLIES
    let targetUser;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    // Check for mentions in command
    if (mentions && mentions.length > 0) {
      targetUser = mentions[0];
    } 
    // Check if replying to a message
    else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      // Get the user being replied to
      targetUser = msg.message.extendedTextMessage.contextInfo.participant;
    }
    // Check for number in args
    else if (args.length > 0) {
      const num = args[0].replace(/[^0-9]/g, '');
      if (num.length > 8) targetUser = num + '@s.whatsapp.net';
    }

    if (!targetUser) {
      await sock.sendMessage(jid, { 
        text: `🦶 *Usage:*\n${PREFIX}kick @user\n${PREFIX}kick <number>\nReply to user's message with ${PREFIX}kick` 
      }, { quoted: msg });
      return;
    }

    // Don't allow kicking yourself
    if (targetUser === sender) {
      await sock.sendMessage(jid, { 
        text: '❌ You cannot kick yourself!' 
      }, { quoted: msg });
      return;
    }

    // Check if target is in group
    const targetInGroup = groupMetadata.participants.find(p => p.id === targetUser);
    if (!targetInGroup) {
      await sock.sendMessage(jid, { 
        text: '❌ User is not in this group.' 
      }, { quoted: msg });
      return;
    }

    try {
      // 🦶 FOOT for kick
      await sock.sendMessage(jid, {
        react: { text: "🦶", key: msg.key }
      });
      
      // Remove user
      await sock.groupParticipantsUpdate(jid, [targetUser], 'remove');
      
      await sock.sendMessage(jid, { 
        text: `🦶 @${targetUser.split('@')[0]} has been kicked from the group.`, 
        mentions: [targetUser] 
      }, { quoted: msg });
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to kick member.' 
      }, { quoted: msg });
    }
  }
};
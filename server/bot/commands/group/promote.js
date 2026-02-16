export default {
  name: 'promote',
  alias: ['admin', 'makeadmin'],
  category: 'group',
  description: 'Promote a member to admin',
  
  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { 
        text: '❌ This command only works in groups.' 
      }, { quoted: msg });
      return;
    }

    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(jid);
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to get group info.' 
      }, { quoted: msg });
      return;
    }

    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: '🛑 Only group admins can use this command.' 
      }, { quoted: msg });
      return;
    }

    // Get target user
    let targetUser;
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    
    if (mentions && mentions.length > 0) {
      targetUser = mentions[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      targetUser = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args.length > 0) {
      const num = args[0].replace(/[^0-9]/g, '');
      if (num.length > 8) targetUser = num + '@s.whatsapp.net';
    }

    if (!targetUser) {
      await sock.sendMessage(jid, { 
        text: `👑 *Usage:*\n${PREFIX}promote @user\n${PREFIX}promote <number>` 
      }, { quoted: msg });
      return;
    }

    const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);
    if (!targetParticipant) {
      await sock.sendMessage(jid, { 
        text: '❌ User not found in this group.' 
      }, { quoted: msg });
      return;
    }

    if (targetParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: `⚠️ @${targetUser.split('@')[0]} is already an admin!`, 
        mentions: [targetUser] 
      }, { quoted: msg });
      return;
    }

    try {
      // 👑 CROWN REACTION for promote
      await sock.sendMessage(jid, {
        react: { text: "👑", key: msg.key }
      });
      
      // Promote
      await sock.groupParticipantsUpdate(jid, [targetUser], 'promote');
      
      // Group message
      await sock.sendMessage(jid, { 
        text: `👑 @${targetUser.split('@')[0]} has been promoted to admin! 🎉`, 
        mentions: [targetUser] 
      }, { quoted: msg });
      
      // 🦊 FOX THEME DM (but fox emoji is fine here)
      try {
        await sock.sendMessage(targetUser, {
          text: `🎉 *FOXY PROMOTION!* 🦊\n\nYou've been promoted to *ADMIN*!\n\nNow you're a clever fox with special powers! 🦊✨\n\nUse your powers wisely!`
        });
      } catch (dmError) {
        // Silent fail
      }
      
      console.log(`👑 Admin promoted: ${targetUser.split('@')[0]}`);
      
    } catch (error) {
      console.error('Promote error:', error);
      await sock.sendMessage(jid, { 
        text: '❌ Failed to promote. Make sure I have admin rights.' 
      }, { quoted: msg });
    }
  }
};
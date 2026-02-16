export default {
  name: 'demote',
  alias: ['removeadmin', 'unadmin'],
  category: 'group',
  description: 'Demote a member from admin',
  
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

    // Get target
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
        text: `⬇️ *Usage:*\n${PREFIX}demote @user` 
      }, { quoted: msg });
      return;
    }

    const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);
    if (!targetParticipant) {
      await sock.sendMessage(jid, { 
        text: '❌ User not in group.' 
      }, { quoted: msg });
      return;
    }

    if (!targetParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: `⚠️ @${targetUser.split('@')[0]} is not an admin.`, 
        mentions: [targetUser] 
      }, { quoted: msg });
      return;
    }

    try {
      // ⬇️ DOWN ARROW for demote
      await sock.sendMessage(jid, {
        react: { text: "⬇️", key: msg.key }
      });
      
      // Demote
      await sock.groupParticipantsUpdate(jid, [targetUser], 'demote');
      
      // Group message
      await sock.sendMessage(jid, { 
        text: `⬇️ @${targetUser.split('@')[0]} demoted from admin.`, 
        mentions: [targetUser] 
      }, { quoted: msg });
      
      console.log(`⬇️ Admin demoted: ${targetUser.split('@')[0]}`);
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to demote.' 
      }, { quoted: msg });
    }
  }
};
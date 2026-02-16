// Mute Command (with 🔇 reaction)
export default {
  name: 'mute',
  alias: ['silence'],
  category: 'group',
  description: 'Mute the group',
  
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

    try {
      // 🔇 MUTE reaction
      await sock.sendMessage(jid, {
        react: { text: "🔇", key: msg.key }
      });
      
      // Mute group (7 days = 604800 seconds)
      await sock.groupSettingUpdate(jid, 'announcement');
      
      await sock.sendMessage(jid, { 
        text: '🔇 Group has been muted. Only admins can send messages.' 
      }, { quoted: msg });
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to mute group.' 
      }, { quoted: msg });
    }
  }
};

// Unmute Command (with 🔊 reaction)
export default {
  name: 'unmute',
  alias: ['unsilence'],
  category: 'group',
  description: 'Unmute the group',
  
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

    try {
      // 🔊 UNMUTE reaction
      await sock.sendMessage(jid, {
        react: { text: "🔊", key: msg.key }
      });
      
      // Unmute group
      await sock.groupSettingUpdate(jid, 'not_announcement');
      
      await sock.sendMessage(jid, { 
        text: '🔊 Group has been unmuted. Everyone can send messages.' 
      }, { quoted: msg });
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to unmute group.' 
      }, { quoted: msg });
    }
  }
};
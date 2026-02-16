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
        text: 'Groups only.' 
      }, { quoted: msg });
      return;
    }

    const groupMetadata = await sock.groupMetadata(jid);
    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
    
    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: 'Admin only.' 
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(jid, {
        react: { text: "\uD83D\uDD0A", key: msg.key }
      });
      
      await sock.groupSettingUpdate(jid, 'not_announcement');
      
      await sock.sendMessage(jid, { 
        text: 'Group has been unmuted. Everyone can send messages.' 
      }, { quoted: msg });
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: 'Failed to unmute group.' 
      }, { quoted: msg });
    }
  }
};

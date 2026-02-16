export default {
  name: 'add',
  alias: ['adduser'],
  category: 'group',
  description: 'Add members to group',
  
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

    // Get numbers
    const numbers = [];
    args.forEach(arg => {
      const num = arg.replace(/[^0-9]/g, '');
      if (num.length >= 10) {
        numbers.push(num + '@s.whatsapp.net');
      }
    });

    if (numbers.length === 0) {
      await sock.sendMessage(jid, { 
        text: `➕ *Usage:*\n${PREFIX}add 1234567890\n${PREFIX}add 123 456 789` 
      }, { quoted: msg });
      return;
    }

    try {
      // ➕ PLUS for add
      await sock.sendMessage(jid, {
        react: { text: "➕", key: msg.key }
      });
      
      // Add users
      await sock.groupParticipantsUpdate(jid, numbers, 'add');
      
      const addedList = numbers.map(num => `@${num.split('@')[0]}`).join('\n');
      await sock.sendMessage(jid, { 
        text: `🦊 Added to the fox den:\n${addedList}`, 
        mentions: numbers 
      }, { quoted: msg });
      
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to add members.' 
      }, { quoted: msg });
    }
  }
};
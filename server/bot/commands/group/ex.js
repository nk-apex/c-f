export default {
  name: 'ex',
  alias: ['exmembers', 'pastmembers'],
  description: 'Show group member info and metadata',
  category: 'group',
  ownerOnly: false,

  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed GROUP ONLY \u29ed\u2500\u2510\n\u2502 This command works in groups only.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    const groupMetadata = await sock.groupMetadata(jid);
    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);

    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed ACCESS DENIED \u29ed\u2500\u2510\n\u2502 Only group admins can use this command.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    const totalMembers = groupMetadata.participants.length;
    const admins = groupMetadata.participants.filter(p => p.admin).length;
    const nonAdmins = totalMembers - admins;
    const createdDate = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleString() : 'Unknown';

    await sock.sendMessage(jid, {
      text: `\u250c\u2500\u29ed GROUP INFO \u29ed\u2500\u2510\n\u2502 Group: ${groupMetadata.subject}\n\u2502 Total Members: ${totalMembers}\n\u2502 Admins: ${admins}\n\u2502 Regular Members: ${nonAdmins}\n\u2502 Created: ${createdDate}\n\u2502\n\u2502 Note: WhatsApp does not expose\n\u2502 removed member history via API.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
    }, { quoted: msg });
  }
};

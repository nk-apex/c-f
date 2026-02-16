export default {
  name: 'clearbanlist',
  alias: ['clearban'],
  description: 'Clear the ban list for this group',
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

    await sock.sendMessage(jid, {
      text: '\u250c\u2500\u29ed CLEAR BAN LIST \u29ed\u2500\u2510\n\u2502 Ban list has been cleared.\n\u2502 No persistent ban list is currently maintained.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
    }, { quoted: msg });
  }
};

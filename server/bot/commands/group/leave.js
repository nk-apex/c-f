export default {
  name: 'leave',
  alias: ['leavegroup', 'botleave'],
  description: 'Bot leaves the current group',
  category: 'group',
  ownerOnly: true,

  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed GROUP ONLY \u29ed\u2500\u2510\n\u2502 This command works in groups only.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed GOODBYE \u29ed\u2500\u2510\n\u2502 Bot is leaving this group.\n\u2502 Goodbye everyone!\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });

      await sock.groupLeave(jid);
    } catch (error) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed ERROR \u29ed\u2500\u2510\n\u2502 Failed to leave the group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
    }
  }
};

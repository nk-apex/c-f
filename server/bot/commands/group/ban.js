function getTargetUser(msg, args) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentions?.length > 0) return mentions[0];
  if (msg.message?.extendedTextMessage?.contextInfo?.participant) return msg.message.extendedTextMessage.contextInfo.participant;
  if (args.length > 0) { const num = args[0].replace(/[^0-9]/g, ''); if (num.length > 8) return num + '@s.whatsapp.net'; }
  return null;
}

export default {
  name: 'ban',
  alias: ['gban'],
  description: 'Ban a user from the group',
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

    const targetUser = getTargetUser(msg, args);

    if (!targetUser) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed BAN \u29ed\u2500\u2510\n\u2502 Usage:\n\u2502 ${PREFIX}ban @user\n\u2502 ${PREFIX}ban <number>\n\u2502 Reply to a message with ${PREFIX}ban\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    if (targetUser === sender) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed BAN \u29ed\u2500\u2510\n\u2502 You cannot ban yourself.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    const targetInGroup = groupMetadata.participants.find(p => p.id === targetUser);
    if (!targetInGroup) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed BAN \u29ed\u2500\u2510\n\u2502 User is not in this group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(jid, [targetUser], 'remove');

      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed BANNED \u29ed\u2500\u2510\n\u2502 @${targetUser.split('@')[0]} has been banned from the group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
        mentions: [targetUser]
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed ERROR \u29ed\u2500\u2510\n\u2502 Failed to ban user. Make sure the bot is admin.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
    }
  }
};

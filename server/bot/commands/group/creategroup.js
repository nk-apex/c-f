export default {
  name: 'creategroup',
  alias: ['newgroup', 'makegroup'],
  description: 'Create a new group',
  category: 'group',
  ownerOnly: true,

  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;

    if (args.length === 0) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed CREATE GROUP \u29ed\u2500\u2510\n\u2502 Usage: ${PREFIX}creategroup <GroupName>\n\u2502 Example: ${PREFIX}creategroup My New Group\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const groupName = args.join(' ');

    try {
      const group = await sock.groupCreate(groupName, []);

      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed GROUP CREATED \u29ed\u2500\u2510\n\u2502 Group "${groupName}" has been created.\n\u2502 ID: ${group.id}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed ERROR \u29ed\u2500\u2510\n\u2502 Failed to create group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
    }
  }
};

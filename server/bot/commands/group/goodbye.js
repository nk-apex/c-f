export default {
  name: "goodbye",
  alias: ["farewell", "goodbyemsg"],
  description: "Set goodbye message for leaving members",
  category: "group",
  ownerOnly: false,
  groupOnly: true,
  adminOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (!args.length) {
      return sock.sendMessage(jid, {
        text: `👋 *GOODBYE MESSAGE*\n\n` +
              `Current: Farewell message for leaving members\n\n` +
              `Commands:\n` +
              `${PREFIX}goodbye on - Enable goodbye messages\n` +
              `${PREFIX}goodbye off - Disable goodbye messages\n` +
              `${PREFIX}goodbye set <message> - Set custom message\n\n` +
              `Variables:\n` +
              `{name} - Member's name\n` +
              `{group} - Group name\n` +
              `{members} - Remaining members\n\n` +
              `Example:\n` +
              `${PREFIX}goodbye set Goodbye {name}! 👋`
      }, { quoted: m });
    }
    
    const action = args[0].toLowerCase();
    
    if (action === "on") {
      return sock.sendMessage(jid, {
        text: `✅ Goodbye messages enabled!\n\n` +
              `Members will get farewell message when leaving.`
      }, { quoted: m });
    } else if (action === "off") {
      return sock.sendMessage(jid, {
        text: `❌ Goodbye messages disabled!\n\n` +
              `No messages when members leave.`
      }, { quoted: m });
    } else if (action === "set") {
      const message = args.slice(1).join(" ");
      if (!message) {
        return sock.sendMessage(jid, {
          text: `❌ Please provide a goodbye message!`
        }, { quoted: m });
      }
      
      return sock.sendMessage(jid, {
        text: `✅ Goodbye message set!\n\n` +
              `Preview:\n` +
              `"${message.replace('{name}', 'John').replace('{group}', 'Test Group').replace('{members}', '49')}"`
      }, { quoted: m });
    }
    
    return sock.sendMessage(jid, {
      text: `❌ Invalid command! Use ${PREFIX}goodbye for help.`
    }, { quoted: m });
  }
};
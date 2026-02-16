export default {
  name: "poll",
  alias: ["survey", "vote"],
  description: "Create a poll in group",
  category: "group",
  ownerOnly: false,
  groupOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (args.length < 3) {
      return sock.sendMessage(jid, {
        text: `📊 *CREATE POLL*\n\n` +
              `Format: ${PREFIX}poll "Question" "Option1" "Option2" ...\n\n` +
              `Examples:\n` +
              `${PREFIX}poll "Best color?" "Red" "Blue" "Green"\n` +
              `${PREFIX}poll "Pizza toppings?" "Pepperoni" "Mushrooms" "Both"\n\n` +
              `💡 Use quotes for multi-word questions/options\n` +
              `📏 Max 12 options`
      }, { quoted: m });
    }
    
    // Parse poll from message
    const messageText = args.join(" ");
    const matches = messageText.match(/"([^"]+)"/g);
    
    if (!matches || matches.length < 3) {
      return sock.sendMessage(jid, {
        text: `❌ Invalid format! Use quotes for question and options.\n\n` +
              `Example: ${PREFIX}poll "Question" "Option1" "Option2"`
      }, { quoted: m });
    }
    
    const question = matches[0].replace(/"/g, '');
    const options = matches.slice(1).map(opt => opt.replace(/"/g, ''));
    
    if (options.length > 12) {
      return sock.sendMessage(jid, {
        text: `❌ Too many options! Max 12 options allowed.\n\n` +
              `You provided: ${options.length} options`
      }, { quoted: m });
    }
    
    // Create poll message
    let pollMsg = `📊 *POLL CREATED*\n\n`;
    pollMsg += `❓ *Question:* ${question}\n\n`;
    pollMsg += `📝 *Options:*\n`;
    
    options.forEach((opt, i) => {
      pollMsg += `${i + 1}. ${opt}\n`;
    });
    
    pollMsg += `\n💡 *How to vote:*\n`;
    pollMsg += `React with number emoji (1️⃣, 2️⃣, etc.)\n`;
    pollMsg += `Or reply with option number\n\n`;
    pollMsg += `Created by: ${m.pushName || "User"}`;
    
    return sock.sendMessage(jid, {
      text: pollMsg
    }, { quoted: m });
  }
};
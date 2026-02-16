const RESPONSES = [
  "🎱 It is certain",
  "🎱 It is decidedly so",
  "🎱 Without a doubt",
  "🎱 Yes definitely",
  "🎱 You may rely on it",
  "🎱 As I see it, yes",
  "🎱 Most likely",
  "🎱 Outlook good",
  "🎱 Yes",
  "🎱 Signs point to yes",
  "🎱 Reply hazy try again",
  "🎱 Ask again later",
  "🎱 Better not tell you now",
  "🎱 Cannot predict now",
  "🎱 Concentrate and ask again",
  "🎱 Don't count on it",
  "🎱 My reply is no",
  "🎱 My sources say no",
  "🎱 Outlook not so good",
  "🎱 Very doubtful"
];

export default {
  name: "8ball",
  alias: ["magic8", "8b", "fortune"],
  description: "Ask the magic 8-ball a question",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (!args.length) {
      return sock.sendMessage(jid, {
        text: `🎱 *MAGIC 8-BALL*\n\n` +
              `Ask a yes/no question!\n\n` +
              `Example: ${PREFIX}8ball Will I be rich today?`
      }, { quoted: m });
    }
    
    const question = args.join(" ");
    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    
    const ballMsg = `🎱 *MAGIC 8-BALL*\n\n` +
                   `❓ Question: ${question}\n\n` +
                   `📜 Answer: *${response}*`;
    
    return sock.sendMessage(jid, {
      text: ballMsg
    }, { quoted: m });
  }
};
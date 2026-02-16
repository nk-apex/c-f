export default {
  name: "flip",
  alias: ["coin", "coinflip"],
  description: "Flip a coin (heads or tails)",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
    const emoji = result === "HEADS" ? "🪙" : "🪙";
    
    const flipMsg = `${emoji} *COIN FLIP*\n\n` +
                   `🎯 You flipped: *${result}*\n\n`;
    
    // Add prediction if user said something
    let prediction = '';
    if (args[0]) {
      const userGuess = args[0].toLowerCase();
      const isHeads = userGuess.includes('head') || userGuess === 'h';
      const isTails = userGuess.includes('tail') || userGuess === 't';
      
      if (isHeads || isTails) {
        const correct = (isHeads && result === "HEADS") || (isTails && result === "TAILS");
        prediction = correct ? "✅ You guessed right!" : "❌ Wrong guess!";
      }
    }
    
    return sock.sendMessage(jid, {
      text: flipMsg + prediction
    }, { quoted: m });
  }
};
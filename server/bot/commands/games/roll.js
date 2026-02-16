export default {
  name: "roll",
  alias: ["dice", "diceroll"],
  description: "Roll a dice (1-6 or custom range)",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    let max = 6;
    if (args[0] && !isNaN(args[0]) && parseInt(args[0]) > 0) {
      max = parseInt(args[0]);
      if (max > 1000) max = 1000; // Limit
    }
    
    const roll = Math.floor(Math.random() * max) + 1;
    
    const result = `🎲 *DICE ROLL*\n\n` +
                   `🎯 Range: 1-${max}\n` +
                   `📊 Result: *${roll}*\n\n`;
    
    let reaction = '';
    if (roll === 1) reaction = '😬 Critical low!';
    else if (roll === max) reaction = '🎉 Critical high!';
    else if (roll > max * 0.8) reaction = '👍 Good roll!';
    else if (roll < max * 0.2) reaction = '👎 Low roll!';
    else reaction = '🎯 Not bad!';
    
    return sock.sendMessage(jid, {
      text: result + reaction
    }, { quoted: m });
  }
};
const HANGMAN_WORDS = [
  "PROGRAMMING", "JAVASCRIPT", "WHATSAPP", "COMPUTER", "KEYBOARD",
  "DEVELOPER", "INTERNET", "NETWORK", "DATABASE", "ALGORITHM",
  "FOXYBOT", "LEON", "COMMAND", "MESSAGE", "CHATBOT"
];

export default {
  name: "hangman",
  alias: ["hm", "hanggame"],
  description: "Play hangman word game",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (!args[0]) {
      return sock.sendMessage(jid, {
        text: `🎮 *HANGMAN GAME*\n\n` +
              `Guess the word letter by letter!\n\n` +
              `Commands:\n` +
              `${PREFIX}hangman start - Start new game\n` +
              `${PREFIX}hangman guess <letter> - Guess a letter\n` +
              `${PREFIX}hangman word <word> - Guess the whole word\n\n` +
              `💡 You have 6 wrong guesses allowed!`
      }, { quoted: m });
    }
    
    const command = args[0].toLowerCase();
    
    if (command === 'start') {
      const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
      const hidden = word.replace(/./g, '_');
      
      const gameMsg = `🎮 *HANGMAN STARTED!*\n\n` +
                     `📖 Category: Technology\n` +
                     `🔤 Word: ${hidden.split('').join(' ')}\n` +
                     `📏 Length: ${word.length} letters\n` +
                     `💡 Wrong guesses left: 6\n\n` +
                     `Guess a letter: ${PREFIX}hangman guess <letter>`;
      
      return sock.sendMessage(jid, {
        text: gameMsg
      }, { quoted: m });
    }
    
    return sock.sendMessage(jid, {
      text: `🎮 Use ${PREFIX}hangman start to begin a game!`
    }, { quoted: m });
  }
};
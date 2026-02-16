const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" }
];

export default {
  name: "quote",
  alias: ["inspire", "motivation"],
  description: "Get an inspirational quote",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    
    const quoteMsg = `💬 *INSPIRATIONAL QUOTE*\n\n` +
                    `"${quote.text}"\n\n` +
                    `— ${quote.author}\n\n` +
                    `💡 Need more inspiration? Use ${PREFIX}quote again!`;
    
    return sock.sendMessage(jid, {
      text: quoteMsg
    }, { quoted: m });
  }
};
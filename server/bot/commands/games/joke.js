const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "What do you call a fake noodle? An impasta!",
  "How does a penguin build its house? Igloos it together!",
  "Why don't skeletons fight each other? They don't have the guts!",
  "What do you call a bear with no teeth? A gummy bear!",
  "Why did the math book look so sad? Because it had too many problems!",
  "What's orange and sounds like a parrot? A carrot!",
  "Why don't eggs tell jokes? They'd crack each other up!",
  "How do you organize a space party? You planet!",
  "Why did the computer go to the doctor? It had a virus!",
  "What's a programmer's favorite hangout place? The Foo Bar!",
  "Why do Java developers wear glasses? Because they don't C#!",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
  "Why was the JavaScript developer sad? Because he didn't Node how to Express himself!"
];

export default {
  name: "joke",
  alias: ["funny", "humor"],
  description: "Get a random joke",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    
    const jokeMsg = `😂 *RANDOM JOKE*\n\n` +
                   `${joke}\n\n` +
                   `💡 Want another? Use ${PREFIX}joke again!`;
    
    return sock.sendMessage(jid, {
      text: jokeMsg
    }, { quoted: m });
  }
};
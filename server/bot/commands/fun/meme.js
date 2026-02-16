// commands/entertainment/meme.js
export default {
  name: "meme",
  alias: ["memes", "dankmeme", "funny"],
  description: "Get random memes from Reddit 🎭",
  category: "entertainment",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    try {
      // Show loading
      await sock.sendMessage(jid, {
        text: "🦊 *Hunting for fresh memes...* 🎯"
      }, { quoted: m });
      
      // Meme subreddits
      const subreddits = [
        'dankmemes', 'memes', 'wholesomememes', 
        'me_irl', 'AdviceAnimals', 'funny',
        'ProgrammerHumor', 'animememes'
      ];
      
      const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
      
      // Fetch meme from API
      const response = await fetch(`https://meme-api.com/gimme/${randomSub}`);
      const data = await response.json();
      
      if (data.nsfw && !jid.includes('@g.us')) {
        return sock.sendMessage(jid, {
          text: "⚠️ *NSFW Meme Alert!*\n\nThis meme is NSFW. Use in groups only or try again! 🦊"
        });
      }
      
      // Send meme
      await sock.sendMessage(jid, {
        image: { url: data.url },
        caption: `🦊 *FOX MEME DELIVERY!* 🎭\n\n` +
                `📛 *Title:* ${data.title}\n` +
                `👤 *Author:* u/${data.author}\n` +
                `⬆️ *Upvotes:* ${data.ups}\n` +
                `🏮 *Subreddit:* r/${data.subreddit}\n\n` +
                `😂 *Fox says:* Hope this brightens your day!`
      });
      
    } catch (error) {
      console.error("Meme error:", error);
      
      // Fallback memes
      const fallbackMemes = [
        "https://i.imgflip.com/30b1gx.jpg", // Drake meme
        "https://i.imgflip.com/1g8my4.jpg", // Two buttons
        "https://i.imgflip.com/1ur9b0.jpg", // Distracted boyfriend
        "https://i.imgflip.com/1bij.jpg",   // Y U NO
        "https://i.imgflip.com/26am.jpg"    // Fry
      ];
      
      const randomMeme = fallbackMemes[Math.floor(Math.random() * fallbackMemes.length)];
      
      await sock.sendMessage(jid, {
        image: { url: randomMeme },
        caption: "🦊 *FOX MEME FALLBACK!* 🎭\n\nClassic meme delivered!\n\n😂 Internet connection failed, but fox always has backup!"
      });
    }
  }
};
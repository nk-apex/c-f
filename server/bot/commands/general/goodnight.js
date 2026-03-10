export default {
  name: "goodnight",
  alias: ["gn", "night", "foxsleep", "dentime", "sleeptime"],
  description: "Fox-themed good night message with invisible mentions 🦊🌙",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const sender = m.pushName || "Sleepy Fox 🦊";
    const isGroup = jid.endsWith('@g.us');
    
    // Current time for appropriate messages
    const hour = new Date().getHours();
    let nightPhase = "evening";
    let foxActivity = "resting";
    
    if (hour >= 21 || hour < 4) {
      nightPhase = "night";
      foxActivity = "night prowling";
    } else if (hour >= 18) {
      nightPhase = "evening";
      foxActivity = "evening hunting";
    } else {
      // If it's not night time, adjust message
      return sock.sendMessage(jid, {
        text: `🦊 *Wrong Time Alert!*\n\nIt's ${hour}:00 - too early for good night, foxy friend! 🌞\n\nTry .gn after sunset! 🌅`
      }, { quoted: m });
    }
    
    // Night wisdom and quotes
    const nightWisdom = [
      "Even foxes need their rest to outsmart tomorrow.",
      "The wise fox sleeps to dream of better hunts.",
      "Stars watch over sleeping foxes.",
      "A rested fox is a clever fox.",
      "Dreams are where foxes practice their cunning.",
      "The moon guards the sleeping den.",
      "Tomorrow's success begins with tonight's rest.",
      "Sleep is the fox's secret weapon."
    ];
    
    // Fox-themed night messages with invisible triggers
    const foxNightMessages = [
      `‌🦊 *Foxy ${nightPhase.toUpperCase()} blessings!* ‌\n\nThe moon rises and the fox den prepares to rest! Sweet dreams to all my fellow foxes! 🌙✨\n\n💭 *Fox Dream:* ${nightWisdom[Math.floor(Math.random() * nightWisdom.length)]}`,
      
      `‌🌙 *The fox den settles down!* ‌\n\n${sender} wishes peaceful ${nightPhase} to all humans in our den! May your sleep be deep and your dreams magical! 🦊🌟\n\n🌠 *Night Wish:* May stars watch over you tonight.`,
      
      `‌✨ *Moonlight magic for the den!* ‌\n\nSending sleepy foxy vibes to every human member! Time to rest those clever minds until dawn! 🌕🦊\n\n🛏️ *Den Rest:* Cozy dens make happy foxes.`,
      
      `‌😴 *Time for fox dreams!* ‌\n\n${sender} hopes all humans in our pack sleep well tonight! Tomorrow awaits with new adventures! 🌲💫\n\n🌌 *Night Sky Wisdom:* ${nightWisdom[Math.floor(Math.random() * nightWisdom.length)]}`,
      
      `‌🌃 *Fox den quiet hours begin!* ‌\n\nEnergy conservation mode activated for all den members! Humans, recharge your brilliance for tomorrow! 🔋🦊\n\n💤 *Sleep Command:* Rest well, dream big.`,
      
      `‌🌟 *The Night Fox guards your sleep!* ‌\n\nFrom ${sender} to all humans in our magnificent den: May your ${nightPhase} be peaceful and your dreams inspiring! 🌙✨\n\n📜 *Night Proverb:* ${nightWisdom[Math.floor(Math.random() * nightWisdom.length)]}`,
      
      `‌🌲 *Forest whispers goodnight!* ‌\n\nThe trees sigh, the wind carries my message: Good ${nightPhase}, dear human friends! Time for ${foxActivity}! 🍃🦊\n\n💭 *Fox Thought:* What wonderful things will you dream tonight?`,
      
      `‌🎯 *Mission: Rest & Recharge!* ‌\n\nFox precision targeting all humans in the den with sleep blessings! Mission starts now! 🎯❤️\n\n🦊 *Fox Fact:* Did you know foxes sleep curled up with their tails as blankets?`
    ];
    
    // For personal chats
    if (!isGroup) {
      const personalNightMsg = foxNightMessages[Math.floor(Math.random() * foxNightMessages.length)]
        .replace(/all humans in our den/g, "you")
        .replace(/all den members/g, "you")
        .replace(/every human member/g, "you")
        .replace(/all humans in our pack/g, "you")
        .replace(/fellow foxes/g, "foxy friend")
        .replace(/human friends/g, "friend")
        .replace(/‌/g, ''); // Remove invisible chars
      
      return sock.sendMessage(jid, {
        text: personalNightMsg
      }, { quoted: m });
    }
    
    // For groups - with invisible mentions
    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];
      const groupName = metadata.subject || "Fox Den 🦊";
      
      if (participants.length === 0) {
        return sock.sendMessage(jid, {
          text: `🦊 *Empty Den Alert!*\n\nThe night finds ${groupName} empty... Where do the foxes sleep? 🌙👀`
        }, { quoted: m });
      }
      
      // Get all JIDs
      const allJids = participants.map(p => p.id);
      
      // Select random night message
      const selectedNightMsg = foxNightMessages[Math.floor(Math.random() * foxNightMessages.length)];
      
      // Count members
      const adminCount = participants.filter(p => p.admin).length;
      const memberCount = participants.length - adminCount;
      
      // Create final message with invisible trigger
      const finalMessage = `‌‎᠎\u200B${selectedNightMsg}\n\n📊 *Den Night Watch:*\n├◆ 🦊 Total Foxes: ${participants.length}\n├◆ 👑 Alpha Foxes Awake: ${adminCount}\n└─ 🌟 Humans Resting: ${memberCount}\n\n🌙 *Night Phase:* ${nightPhase.toUpperCase()}\n⏰ *Time:* ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n📅 *Date:* ${new Date().toLocaleDateString()}\n🎭 *Sent by:* ${sender}\n\n💫 *Sleep Note:* You've been invisibly blessed with fox sleep magic! 🦊✨`;
      
      // Send with invisible mentions
      return sock.sendMessage(jid, {
        text: finalMessage,
        mentions: allJids
      }, { quoted: m });
      
    } catch (error) {
      console.error("Fox night call failed:", error);
      
      // Simple night fallback
      return sock.sendMessage(jid, {
        text: `🦊 *Fox Night Blessings!* 🌙\n\n${sender} wishes all humans in the den a peaceful night and sweet dreams! Sleep well, my friends! 🌟✨`
      }, { quoted: m });
    }
  }
};
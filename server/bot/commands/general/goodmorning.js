export default {
  name: "goodmorning",
  alias: ["gm", "morning", "foxmorning", "humans", "denwake"],
  description: "Fox greets humans in the den with morning blessings 🦊🌅",
  category: "general",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const sender = m.pushName || "Sly Fox 🦊";
    const isGroup = jid.endsWith('@g.us');
    
    // Current time for time-appropriate messages
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    let humanActivity = "starting your day";
    
    if (hour < 5) {
      timeOfDay = "very early morning";
      humanActivity = "early rising";
    } else if (hour < 12) {
      timeOfDay = "morning";
      humanActivity = "morning routine";
    } else if (hour < 17) {
      timeOfDay = "afternoon";
      humanActivity = "midday activities";
      return sock.sendMessage(jid, {
        text: `🦊 *Time Check!*\n\nIt's ${hour}:00 - a bit late for morning greetings, human! 🌞\n\nTry .gn for good night instead! 🌙`
      }, { quoted: m });
    } else {
      timeOfDay = "evening";
      humanActivity = "evening plans";
      return sock.sendMessage(jid, {
        text: `🦊 *Fox Time Sense!*\n\nIt's already ${hour}:00 - evening approaches! 🌆\n\nPerhaps .gn would be more appropriate now? 🌙`
      }, { quoted: m });
    }
    
    // Human-focused fox wisdom
    const humanWisdom = [
      "Humans are clever like foxes when they work together.",
      "Your human potential shines brightest in the morning.",
      "A human with a plan outsmarts any obstacle.",
      "Your human spirit is the den's greatest treasure.",
      "Humans bring light to the fox's forest.",
      "Your human creativity makes the den magical.",
      "Human kindness warms the fox's heart.",
      "Your human intelligence guides the pack forward."
    ];
    
    // Messages addressing humans (not foxes)
    const humanMessages = [
      `‌🦊 *Foxy ${timeOfDay.toUpperCase()} to all HUMANS!* ‌\n\nThis clever fox awakens to greet you! May your human day be brilliant and successful! 🌅✨\n\n🎯 *Fox Advice:* ${humanWisdom[Math.floor(Math.random() * humanWisdom.length)]}`,
      
      `‌🌅 *The fox greets human friends!* ‌\n\n${sender} here, sending ${timeOfDay} blessings to all humans in our den! Time for ${humanActivity}! 🦊🌟\n\n💫 *Human Energy:* Your potential is limitless today!`,
      
      `‌✨ *Fox magic for humans!* ‌\n\nChanneling positive foxy energy to every human in our pack! This ${timeOfDay} is yours to conquer! 🎯🌈\n\n🏮 *Den Truth:* Humans make this den wonderful.`,
      
      `‌😊 *Hello, wonderful humans!* ‌\n\n${sender} hopes you're ready to embrace this ${timeOfDay}! Remember: You're smarter than you think! 🦊💫\n\n🌲 *Forest Whisper:* ${humanWisdom[Math.floor(Math.random() * humanWisdom.length)]}`,
      
      `‌⚡ *Human power activation!* ‌\n\nFox transmission to all humans initiated! Receive your daily dose of clever inspiration! 🚀🦊\n\n🎭 *Fox Observation:* "Humans are fascinating creatures."`,
      
      `‌🌟 *The Wise Fox addresses humanity!* ‌\n\nFrom ${sender} to all humans in our magnificent den: May your ${timeOfDay} be as bright as human ingenuity! 🧠✨\n\n📜 *Fox Proverb:* ${humanWisdom[Math.floor(Math.random() * humanWisdom.length)]}`,
      
      `‌🌲 *Forest call to all humans!* ‌\n\nThe trees whisper, the wind carries my message: Good ${timeOfDay}, dear human friends! Your cleverness lights up our den! 🍃🦊\n\n💭 *Fox Question:* What will you create today?`,
      
      `‌🎯 *Target: Human Happiness!* ‌\n\nFox precision targeting every human with joy and motivation! Bullseye on making today amazing! 🎯❤️\n\n🦊 *Fox Fact:* Did you know foxes think humans are interesting?`
    ];
    
    // For personal chats
    if (!isGroup) {
      const personalHumanMsg = humanMessages[Math.floor(Math.random() * humanMessages.length)]
        .replace(/all HUMANS/g, "human")
        .replace(/all humans/g, "you")
        .replace(/every human/g, "you")
        .replace(/human friends/g, "friend")
        .replace(/humans in our den/g, "you")
        .replace(/‌/g, ''); // Remove invisible chars
      
      return sock.sendMessage(jid, {
        text: personalHumanMsg
      }, { quoted: m });
    }
    
    // For groups - addressing humans
    try {
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants || [];
      const groupName = metadata.subject || "Human-Fox Den 🦊";
      
      if (participants.length === 0) {
        return sock.sendMessage(jid, {
          text: `🦊 *Empty Den Alert!*\n\n${groupName} has no humans to greet... Where has everyone gone? 🌲👀`
        }, { quoted: m });
      }
      
      // Get all JIDs
      const allJids = participants.map(p => p.id);
      
      // Select random human message
      const selectedHumanMsg = humanMessages[Math.floor(Math.random() * humanMessages.length)];
      
      // Count humans (all participants are humans)
      const adminCount = participants.filter(p => p.admin).length;
      const regularCount = participants.length - adminCount;
      
      // Create final message with invisible trigger
      const finalMessage = `‌‎᠎\u200B${selectedHumanMsg}\n\n📊 *Den Human Census:*\n├◆ 🧑 Total Humans: ${participants.length}\n├◆ 👑 Human Leaders: ${adminCount}\n└─ 🌟 Clever Humans: ${regularCount}\n\n⏰ *Greeting Time:* ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n📅 *Date:* ${new Date().toLocaleDateString()}\n🎭 *Sent by:* ${sender} (your friendly fox)\n\n💫 *Note:* All humans invisibly greeted by fox magic! 🦊✨`;
      
      // Send with invisible mentions
      return sock.sendMessage(jid, {
        text: finalMessage,
        mentions: allJids
      }, { quoted: m });
      
    } catch (error) {
      console.error("Human greeting failed:", error);
      
      // Simple human greeting fallback
      return sock.sendMessage(jid, {
        text: `🦊 *Fox Greetings to Humans!* 🌅\n\n${sender} wishes all wonderful humans in the den a brilliant ${timeOfDay}! May your human day be amazing! 🎯✨`
      }, { quoted: m });
    }
  }
};
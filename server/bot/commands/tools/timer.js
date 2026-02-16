export default {
  name: "timer",
  alias: ["alarm", "countdown", "reminder"],
  description: "Set a timer or reminder",
  category: "tools",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (args.length < 2) {
      return sock.sendMessage(jid, {
        text: `⏱️ *TIMER SETTING*\n\n` +
              `Format: ${PREFIX}timer <time> <message>\n\n` +
              `Time formats:\n` +
              `• 30s - 30 seconds\n` +
              `• 5m - 5 minutes\n` +
              `• 2h - 2 hours\n` +
              `• 1d - 1 day\n\n` +
              `Examples:\n` +
              `${PREFIX}timer 5m Pizza ready!\n` +
              `${PREFIX}timer 30s Break time!\n` +
              `${PREFIX}timer 1h Meeting starts\n\n` +
              `💡 Bot will remind you when time's up!`
      }, { quoted: m });
    }
    
    const timeStr = args[0].toLowerCase();
    const message = args.slice(1).join(" ");
    
    let milliseconds = 0;
    
    if (timeStr.endsWith('s')) {
      milliseconds = parseInt(timeStr) * 1000;
    } else if (timeStr.endsWith('m')) {
      milliseconds = parseInt(timeStr) * 60 * 1000;
    } else if (timeStr.endsWith('h')) {
      milliseconds = parseInt(timeStr) * 60 * 60 * 1000;
    } else if (timeStr.endsWith('d')) {
      milliseconds = parseInt(timeStr) * 24 * 60 * 60 * 1000;
    } else {
      milliseconds = parseInt(timeStr) * 1000; // Default to seconds
    }
    
    if (isNaN(milliseconds) || milliseconds <= 0) {
      return sock.sendMessage(jid, {
        text: `❌ Invalid time format!\n\n` +
              `Use: 30s, 5m, 2h, 1d\n` +
              `Example: ${PREFIX}timer 5m Reminder`
      }, { quoted: m });
    }
    
    if (milliseconds > 24 * 60 * 60 * 1000) {
      return sock.sendMessage(jid, {
        text: `❌ Maximum timer is 24 hours!\n\n` +
              `Use shorter time intervals.`
      }, { quoted: m });
    }
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const timeDisplay = minutes > 0 ? 
      `${minutes}m ${seconds}s` : 
      `${seconds}s`;
    
    const timerMsg = `⏱️ *TIMER SET*\n\n` +
                    `⏳ Time: ${timeDisplay}\n` +
                    `📝 Message: ${message}\n` +
                    `👤 Set by: ${m.pushName || "You"}\n\n` +
                    `⏰ I'll remind you when time's up!`;
    
    await sock.sendMessage(jid, {
      text: timerMsg
    }, { quoted: m });
    
    // Set timeout for reminder
    setTimeout(async () => {
      const reminderMsg = `⏰ *TIMER COMPLETE!*\n\n` +
                         `📝 ${message}\n` +
                         `👤 Set by: ${m.pushName || "You"}\n\n` +
                         `⏱️ Timer: ${timeDisplay} completed`;
      
      await sock.sendMessage(jid, {
        text: reminderMsg
      });
    }, milliseconds);
    
    return;
  }
};
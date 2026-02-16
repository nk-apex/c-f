// commands/utilities/tts.js
export default {
  name: "tts",
  alias: ["speak", "say", "voice"],
  description: "Convert text to speech 🔊",
  category: "utilities",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `🦊 *FOX TEXT TO SPEECH* 🔊\n\n` +
              `*Usage:*\n` +
              `${PREFIX}tts Hello world\n\n` +
              `${PREFIX}tts lang=en Hello world\n\n` +
              `*Available Languages:*\n` +
              `🇺🇸 en - English\n` +
              `🇮🇩 id - Indonesian\n` +
              `🇪🇸 es - Spanish\n` +
              `🇫🇷 fr - French\n` +
              `🇩🇪 de - German\n` +
              `🇯🇵 ja - Japanese\n` +
              `🇰🇷 ko - Korean\n` +
              `🇷🇺 ru - Russian\n` +
              `🇸🇦 ar - Arabic\n` +
              `🇮🇳 hi - Hindi\n\n` +
              `*Example:*\n` +
              `${PREFIX}tts lang=id Halo teman-teman\n\n` +
              `✨ *Fox can speak many languages!*`
      }, { quoted: m });
    }
    
    try {
      // Parse language and text
      let lang = 'en';
      let text = args.join(' ');
      
      // Check for language parameter
      if (args[0].startsWith('lang=')) {
        lang = args[0].split('=')[1];
        text = args.slice(1).join(' ');
      }
      
      if (text.length > 200) {
        return sock.sendMessage(jid, {
          text: "❌ *Text too long!*\n\nKeep under 200 characters! 📝"
        }, { quoted: m });
      }
      
      // Show processing
      await sock.sendMessage(jid, {
        text: `🦊 *Fox is speaking...* 🎤\n\n"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
      }, { quoted: m });
      
      // Google TTS URL
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
      
      // Download TTS audio
      const response = await fetch(ttsUrl);
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      // Send as audio message
      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: true, // Push to talk
        fileName: `fox_tts_${Date.now()}.mp3`
      });
      
      // Send info
      await sock.sendMessage(jid, {
        text: `✅ *TTS DELIVERED!* 🦊\n\n` +
              `📝 *Text:* ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n` +
              `🗣️ *Language:* ${lang.toUpperCase()}\n` +
              `👤 *Requested by:* ${m.pushName || 'Anonymous'}\n\n` +
              `✨ *Fox voice activated!* 🔊`
      });
      
    } catch (error) {
      console.error("TTS error:", error);
      
      await sock.sendMessage(jid, {
        text: `❌ *TTS Failed!* 🦊\n\n` +
              `*Possible issues:*\n` +
              `• Invalid language code\n` +
              `• Text contains special characters\n` +
              `• Network error\n\n` +
              `💡 *Try:* Simple text in English first!`
      }, { quoted: m });
    }
  }
};
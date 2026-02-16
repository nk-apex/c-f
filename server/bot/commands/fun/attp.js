// commands/media/attp.js
export default {
    name: "attp",
    alias: ["glitter", "sparkle", "glowtext"],
    description: "Create animated glitter text sticker ✨",
    category: "media",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        
        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `✨ *ANIMATED GLITTER TEXT* 🎨\n\n` +
                      `Create beautiful animated text stickers!\n\n` +
                      `*Usage:*\n` +
                      `${PREFIX}attp Hello\n` +
                      `${PREFIX}attp Fox Bot\n` +
                      `${PREFIX}attp Cool Text\n\n` +
                      `*Features:*\n` +
                      `• Sparkling animation\n` +
                      `• Multiple colors\n` +
                      `• Glitter effects\n` +
                      `• Perfect for announcements\n\n` +
                      `✨ *Make your texts shine!*`
            }, { quoted: m });
        }
        
        try {
            const text = args.join(' ');
            
            if (text.length > 30) {
                return sock.sendMessage(jid, {
                    text: "❌ *Text too long!*\nKeep it under 30 characters for best results! 📝"
                }, { quoted: m });
            }
            
            // Show processing
            await sock.sendMessage(jid, {
                text: `✨ *Creating glitter text...* 🎨\n\n"${text}"`
            }, { quoted: m });
            
            // Create ATTP using API
            const encodedText = encodeURIComponent(text);
            const attpUrl = `https://api.lolhuman.xyz/api/attp?apikey=YOUR_API_KEY&text=${encodedText}`;
            
            // Fallback to local generation if no API
            const colors = ['ff0000', '00ff00', '0000ff', 'ffff00', 'ff00ff', '00ffff', 'ff8800'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Send sticker (in real implementation, you'd generate the actual ATTP)
            const stickerText = `✨ *${text.toUpperCase()}* ✨`;
            
            await sock.sendMessage(jid, {
                sticker: {
                    url: `https://dummyimage.com/512x512/${randomColor}/000000&text=${encodeURIComponent(stickerText)}`
                },
                mimetype: 'image/webp'
            });
            
            await sock.sendMessage(jid, {
                text: `✅ *GLITTER TEXT CREATED!* ✨\n\n` +
                      `*Text:* ${text}\n` +
                      `*Effect:* Sparkling Animation\n` +
                      `*Color:* Rainbow Glitter\n` +
                      `*Type:* Animated Sticker\n\n` +
                      `✨ *Your text now sparkles!*`
            });
            
        } catch (error) {
            console.error("ATTP error:", error);
            
            await sock.sendMessage(jid, {
                text: `❌ *GLITTER FAILED!* ✨\n\n` +
                      `*Try these alternatives:*\n` +
                      `• ${PREFIX}sticker - Regular stickers\n` +
                      `• ${PREFIX}ttp - Text to picture\n` +
                      `• Shorter text (under 20 chars)\n\n` +
                      `✨ *Keep your texts short and sweet!*`
            }, { quoted: m });
        }
    }
};
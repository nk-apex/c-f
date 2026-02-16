// commands/ai/room.js
export default {
    name: "room",
    alias: ["interior", "designroom"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        const roomTypes = [
            "modern living room",
            "cozy bedroom",
            "minimalist kitchen",
            "gaming room setup",
            "home office workspace",
            "luxury bathroom",
            "studio apartment",
            "library with bookshelves",
            "mansion dining room",
            "balcony garden view"
        ];
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `🏠 *AI ROOM DESIGNER*\n\n` +
                      `*Usage:* ${prefix}room <room type>\n\n` +
                      `*Available Rooms:*\n` +
                      `${roomTypes.join('\n')}\n\n` +
                      `*Examples:*\n` +
                      `${prefix}room modern living room\n` +
                      `${prefix}room cozy bedroom\n` +
                      `${prefix}room gaming room`
            });
        }
        
        const roomDesc = args.join(' ');
        const prompt = `interior design of ${roomDesc}, realistic, architectural visualization, high quality`;
        
        try {
            await sock.sendMessage(jid, {
                text: `🏠 Designing ${roomDesc}...`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `🏠 *ROOM DESIGN*\n\n` +
                        `*Room:* ${roomDesc}\n\n` +
                        `✨ Interior design inspiration!\n` +
                        `Use this to plan your room makeover.`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `❌ Room design failed\nTry: ${prefix}room bedroom`
            });
        }
    }
};
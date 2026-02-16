// commands/ai/logo.js
export default {
    name: "logo",
    alias: ["brand", "designlogo"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `🎨 *AI LOGO DESIGNER*\n\n` +
                      `${prefix}logo <business name/type>\n\n` +
                      `*Examples:*\n` +
                      `${prefix}logo coffee shop\n` +
                      `${prefix}logo tech startup\n` +
                      `${prefix}logo gym fitness\n` +
                      `${prefix}logo bakery cake\n\n` +
                      `✨ Get professional logos instantly!`
            });
        }
        
        const business = args.join(' ');
        const prompt = `professional logo design for ${business}, minimalist, vector, clean, modern, branding`;
        
        try {
            await sock.sendMessage(jid, {
                text: `🎨 Designing logo for "${business}"...`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `🎨 *LOGO DESIGN*\n\n` +
                        `*Business:* ${business}\n\n` +
                        `💡 Use this as inspiration for your brand!\n` +
                        `✨ Need variations? Run command again!`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `❌ Logo design failed\nTry: ${prefix}logo cafe`
            });
        }
    }
};
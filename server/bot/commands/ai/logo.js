export default {
    name: "logo",
    alias: ["brand", "designlogo"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *AI Logo Designer*\n` +
                      `\u2502 Usage: ${prefix}logo <business/type>\n` +
                      `\u2502\n` +
                      `\u2502 Examples:\n` +
                      `\u2502 ${prefix}logo coffee shop\n` +
                      `\u2502 ${prefix}logo tech startup\n` +
                      `\u2502 ${prefix}logo gym fitness\n` +
                      `\u2502 ${prefix}logo bakery cake\n` +
                      `\u2502\n` +
                      `\u2502 Get professional logos instantly!\n` +
                      `\u2514\u2500\u29ED`
            });
        }
        
        const business = args.join(' ');
        const prompt = `professional logo design for ${business}, minimalist, vector, clean, modern, branding`;
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Designing logo for "${business}"...\n\u2514\u2500\u29ED`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `\u250C\u2500\u29ED *Logo Design*\n` +
                        `\u2502 Business: ${business}\n` +
                        `\u2502 Use as inspiration for your brand!\n` +
                        `\u2502 Need variations? Run command again!\n` +
                        `\u2514\u2500\u29ED`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Logo design failed\n\u2502 Try: ${prefix}logo cafe\n\u2514\u2500\u29ED`
            });
        }
    }
};
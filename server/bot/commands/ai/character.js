export default {
    name: "character",
    alias: ["createchar", "hero"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *AI Character Creator*\n` +
                      `\u2502\n` +
                      `\u2502 Usage:\n` +
                      `\u2502 ${prefix}character warrior elf\n` +
                      `\u2502 ${prefix}character cyberpunk hacker\n` +
                      `\u2502 ${prefix}character wizard with staff\n` +
                      `\u2502\n` +
                      `\u2502 Races: elf, human, orc, dwarf, alien\n` +
                      `\u2502 Classes: warrior, mage, rogue, archer\n` +
                      `\u2502 Themes: cyberpunk, fantasy, steampunk\n` +
                      `\u2514\u2500\u29ED`
            });
        }
        
        const prompt = `character design of ${args.join(' ')}, detailed, fantasy art, concept art, full body`;
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Creating character: ${args.join(' ')}...\n\u2514\u2500\u29ED`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `\u250C\u2500\u29ED *Character Created*\n` +
                        `\u2502 Description: ${args.join(' ')}\n` +
                        `\u2502 Use this character in your stories!\n` +
                        `\u2514\u2500\u29ED`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Failed to create character\n\u2502 Try: ${prefix}character warrior\n\u2514\u2500\u29ED`
            });
        }
    }
};
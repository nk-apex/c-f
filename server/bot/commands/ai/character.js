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
                      `\u251C\u25C6 Usage:\n` +
                      `\u251C\u25C6 ${prefix}character warrior elf\n` +
                      `\u251C\u25C6 ${prefix}character cyberpunk hacker\n` +
                      `\u251C\u25C6 ${prefix}character wizard with staff\n` +
                      `\u2502\n` +
                      `\u251C\u25C6 Races: elf, human, orc, dwarf, alien\n` +
                      `\u251C\u25C6 Classes: warrior, mage, rogue, archer\n` +
                      `\u251C\u25C6 Themes: cyberpunk, fantasy, steampunk\n` +
                      `\u2514\u2500\u29ED`
            });
        }
        
        const prompt = `character design of ${args.join(' ')}, detailed, fantasy art, concept art, full body`;
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Processing...*\n\u251C\u25C6 Creating character: ${args.join(' ')}...\n\u2514\u2500\u29ED`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `\u250C\u2500\u29ED *Character Created*\n` +
                        `\u251C\u25C6 Description: ${args.join(' ')}\n` +
                        `\u251C\u25C6 Use this character in your stories!\n` +
                        `\u2514\u2500\u29ED`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Failed to create character\n\u251C\u25C6 Try: ${prefix}character warrior\n\u2514\u2500\u29ED`
            });
        }
    }
};
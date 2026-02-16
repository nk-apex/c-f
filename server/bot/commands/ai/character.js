// commands/ai/character.js
export default {
    name: "character",
    alias: ["createchar", "hero"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            const examples = [
                "🎭 *AI CHARACTER CREATOR*",
                "",
                "*Usage:*",
                `${prefix}character warrior elf`,
                `${prefix}character cyberpunk hacker`,
                `${prefix}character wizard with staff`,
                "",
                "*Races:* elf, human, orc, dwarf, alien",
                "*Classes:* warrior, mage, rogue, archer, knight",
                "*Themes:* cyberpunk, fantasy, steampunk, sci-fi",
                "",
                "*Example:*",
                `${prefix}character female elf archer in forest`
            ].join('\n');
            
            return sock.sendMessage(jid, { text: examples });
        }
        
        const prompt = `character design of ${args.join(' ')}, detailed, fantasy art, concept art, full body`;
        
        try {
            await sock.sendMessage(jid, {
                text: `🎭 Creating character: ${args.join(' ')}...`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `🎭 *CHARACTER CREATED*\n\n` +
                        `*Description:* ${args.join(' ')}\n\n` +
                        `✨ Use this character in your stories!`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `❌ Failed to create character\nTry: ${prefix}character warrior`
            });
        }
    }
};
// commands/ai/story.js
export default {
    name: "storyart",
    alias: ["illustrate", "bookart"],
    category: "ai",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            const storyPrompts = [
                "a knight fighting a dragon",
                "wizard casting spell in ancient library",
                "space explorer on alien planet",
                "pirate ship battle at sea",
                "samurai in cherry blossom garden",
                "cyberpunk detective in rain",
                "fairy in enchanted forest",
                "robot discovering emotions",
                "ghost haunting old mansion",
                "time traveler in ancient Egypt"
            ];
            
            const randomPrompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];
            
            return sock.sendMessage(jid, {
                text: `📖 *AI STORY ILLUSTRATOR*\n\n` +
                      `*Usage:* ${prefix}storyart <scene description>\n\n` +
                      `*Example:* ${prefix}storyart ${randomPrompt}\n\n` +
                      `*Or try these ideas:*\n` +
                      `${prefix}storyart castle under siege\n` +
                      `${prefix}storyart underwater city\n` +
                      `${prefix}storyart magic school`
            });
        }
        
        const scene = args.join(' ');
        const prompt = `storybook illustration of ${scene}, detailed, fantasy art, children's book style`;
        
        try {
            await sock.sendMessage(jid, {
                text: `📖 Illustrating story scene...`
            });
            
            const url = `https://apiskeith.vercel.app/ai/flux?q=${encodeURIComponent(prompt)}`;
            
            await sock.sendMessage(jid, {
                image: { url: url },
                caption: `📖 *STORY ILLUSTRATION*\n\n` +
                        `*Scene:* ${scene}\n\n` +
                        `✨ Use this image for your story!\n` +
                        `Write a short story based on this scene.`
            });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `❌ Failed to illustrate\nTry: ${prefix}storyart dragon`
            });
        }
    }
};
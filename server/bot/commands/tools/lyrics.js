// commands/music/lyrics.js
import axios from 'axios';

export default {
    name: "lyrics",
    alias: ["lyric", "ly", "songwords"],
    category: "music",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        // Start with music note
        await sock.sendMessage(jid, {
            react: { text: "🎵", key: m.key }
        });
        
        if (!args.length) {
            await sock.sendMessage(jid, {
                text: `${prefix}lyrics <song name>\nExample: ${prefix}lyrics what shall I render to Jehovah`
            }, { quoted: m });
            return;
        }
        
        const query = args.join(' ');
        
        try {
            // Searching
            await sock.sendMessage(jid, {
                react: { text: "🔍", key: m.key }
            });
            
            // Use the working Keith API endpoint
            const response = await axios.get(
                `https://apiskeith.vercel.app/search/lyrics2?query=${encodeURIComponent(query)}`,
                { timeout: 10000 }
            );
            
            const data = response.data;
            
            if (!data.status || !data.result) {
                await sock.sendMessage(jid, {
                    react: { text: "❌", key: m.key }
                });
                await sock.sendMessage(jid, {
                    text: `❌ No lyrics found for "${query}"`
                }, { quoted: m });
                return;
            }
            
            // Success reaction
            await sock.sendMessage(jid, {
                react: { text: "✅", key: m.key }
            });
            
            // Get lyrics and format them
            const lyrics = data.result;
            
            // Check if lyrics are too long for one message
            if (lyrics.length > 3500) {
                // Split into two parts
                const midPoint = lyrics.lastIndexOf('\n\n', 3500);
                const part1 = lyrics.substring(0, midPoint);
                const part2 = lyrics.substring(midPoint);
                
                // Send first part
                await sock.sendMessage(jid, {
                    text: `🎶 *LYRICS: ${query.toUpperCase()}*\n\n${part1}\n\n📝 [1/2]`
                }, { quoted: m });
                
                // Send second part after delay
                setTimeout(async () => {
                    await sock.sendMessage(jid, {
                        text: `🎶 *LYRICS CONTINUED*\n\n${part2}\n\n📝 [2/2] - End of lyrics`
                    });
                }, 500);
                
            } else {
                // Send complete lyrics in one message
                await sock.sendMessage(jid, {
                    text: `🎶 *${query.toUpperCase()}*\n\n${lyrics}`
                }, { quoted: m });
            }
            
        } catch (error) {
            console.error('Lyrics error:', error);
            
            await sock.sendMessage(jid, {
                react: { text: "💥", key: m.key }
            });
            
            await sock.sendMessage(jid, {
                text: `💥 Lyrics search failed\n\nTry: ${prefix}lyrics ${args[0]}`
            }, { quoted: m });
        }
    }
};
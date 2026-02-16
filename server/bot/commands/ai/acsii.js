// commands/fun/ascii.js
export default {
    name: "ascii",
    alias: ["asciiart", "textart"],
    category: "fun",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `🎨 *ASCII ART* 🎨\n\n` +
                      `Usage: ${PREFIX}ascii <text>\n` +
                      `${PREFIX}ascii <emoji/object>\n\n` +
                      `Examples:\n` +
                      `• ${PREFIX}ascii hello\n` +
                      `• ${PREFIX}ascii heart\n` +
                      `• ${PREFIX}ascii cat\n` +
                      `• ${PREFIX}ascii robot\n` +
                      `• ${PREFIX}ascii 🐱`
            }, { quoted: m });
        }
        
        const text = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `🎨 Creating ASCII art...`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            const prompt = `Create ASCII art for: "${text}"
            
            Requirements:
            1. Use only text characters (no emojis)
            2. Make it visually appealing
            3. Keep width under 30 characters if possible
            4. If it's text, make it stylish
            5. If it's an object, make it recognizable
            
            Return only the ASCII art.`;
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { apikey: 'tkm', text: prompt },
                timeout: 15000
            });
            
            const asciiArt = response.data?.result || response.data?.response;
            
            await sock.sendMessage(jid, {
                text: `🎨 *ASCII ART: ${text}*\n\n\`\`\`\n${asciiArt}\n\`\`\`\n\n✨ Text Art Created`
            }, { quoted: m });
            
        } catch (error) {
            console.error("ASCII error:", error);
            
            // Simple fallback ASCII
            const simpleAscii = {
                'heart': `❤️\n♡♡♡♡♡\n♡♡♡♡♡\n♡♡♡♡♡\n  ♡♡♡\n    ♡`,
                'cat': `/\\_/\\\n( o.o )\n > ^ <`,
                'smile': `:-)`,
                'hello': `H   H  EEEE  L     L      OOO\nH   H  E     L     L     O   O\nHHHHH  EEE   L     L     O   O\nH   H  E     L     L     O   O\nH   H  EEEE  LLLL  LLLL   OOO`
            };
            
            const lowerText = text.toLowerCase();
            if (simpleAscii[lowerText]) {
                await sock.sendMessage(jid, {
                    text: `🎨 *ASCII: ${text}*\n\n\`\`\`\n${simpleAscii[lowerText]}\n\`\`\``
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    text: `❌ ASCII art failed\nTry: ${PREFIX}ascii heart`
                }, { quoted: m });
            }
        }
    }
};
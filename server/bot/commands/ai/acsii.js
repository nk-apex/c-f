export default {
    name: "ascii",
    alias: ["asciiart", "textart"],
    category: "fun",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *ASCII Art*\n` +
                      `\u2502 Usage: ${PREFIX}ascii <text>\n` +
                      `\u2502 ${PREFIX}ascii <emoji/object>\n` +
                      `\u2502\n` +
                      `\u2502 Examples:\n` +
                      `\u2502 ${PREFIX}ascii hello\n` +
                      `\u2502 ${PREFIX}ascii heart\n` +
                      `\u2502 ${PREFIX}ascii cat\n` +
                      `\u2502 ${PREFIX}ascii robot\n` +
                      `\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const text = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Creating ASCII art...\n\u2514\u2500\u29ED`
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
                text: `\u250C\u2500\u29ED *ASCII Art: ${text}*\n\u2502\n\`\`\`\n${asciiArt}\n\`\`\`\n\u2502\n\u2502 Text Art Created\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
        } catch (error) {
            console.error("ASCII error:", error);
            
            const simpleAscii = {
                'heart': `/\\_/\\\n( o.o )\n > ^ <`,
                'cat': `/\\_/\\\n( o.o )\n > ^ <`,
                'smile': `:-)`,
                'hello': `H   H  EEEE  L     L      OOO\nH   H  E     L     L     O   O\nHHHHH  EEE   L     L     O   O\nH   H  E     L     L     O   O\nH   H  EEEE  LLLL  LLLL   OOO`
            };
            
            const lowerText = text.toLowerCase();
            if (simpleAscii[lowerText]) {
                await sock.sendMessage(jid, {
                    text: `\u250C\u2500\u29ED *ASCII: ${text}*\n\u2502\n\`\`\`\n${simpleAscii[lowerText]}\n\`\`\`\n\u2514\u2500\u29ED`
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    text: `\u250C\u2500\u29ED *Error*\n\u2502 ASCII art failed\n\u2502 Try: ${PREFIX}ascii heart\n\u2514\u2500\u29ED`
                }, { quoted: m });
            }
        }
    }
};
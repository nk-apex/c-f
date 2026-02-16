export default {
    name: "teach",
    alias: ["teacher", "learn", "tutor", "explain"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *AI Teacher*\n` +
                      `\u2502 Usage: ${PREFIX}teach <topic>\n` +
                      `\u2502 Aliases: ${PREFIX}teacher, ${PREFIX}learn\n` +
                      `\u2502\n` +
                      `\u2502 Examples:\n` +
                      `\u2502 ${PREFIX}teach how rainbows form\n` +
                      `\u2502 ${PREFIX}teacher basic algebra\n` +
                      `\u2502 ${PREFIX}learn about photosynthesis\n` +
                      `\u2502\n` +
                      `\u2502 I'll explain any topic in simple,\n` +
                      `\u2502 clear language!\n` +
                      `\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const topic = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Processing...*\n\u2502 Teaching: "${topic}"\n\u2502 Preparing your lesson...\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { 
                    apikey: 'tkm', 
                    text: `Explain "${topic}" in simple, clear terms. Use everyday language and examples. Avoid technical symbols.`
                },
                timeout: 30000
            });
            
            const answer = response.data?.result || response.data?.response || 
                          `I'll explain ${topic} in simple terms...`;
            
            const lesson = `\u250C\u2500\u29ED *Lesson: ${topic}*\n` +
                          `\u2502\n` +
                          `\u2502 ${answer.split('\n').join('\n\u2502 ')}\n` +
                          `\u2502\n` +
                          `\u2502 Tip: Try explaining this to\n` +
                          `\u2502 someone else to test your\n` +
                          `\u2502 understanding!\n` +
                          `\u2514\u2500\u29ED`;
            
            await sock.sendMessage(jid, {
                text: lesson
            }, { quoted: m });
            
        } catch (error) {
            console.error("Teach error:", error.message);
            
            let errorDetail = error.message;
            if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
                errorDetail = 'Lesson took too long. Try a simpler topic.';
            } else if (error.message.includes('Network Error')) {
                errorDetail = 'Network connection failed.';
            } else if (error.response?.status === 404) {
                errorDetail = 'Teaching API not available.';
            }
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Teaching session failed\n\u2502 ${errorDetail}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};
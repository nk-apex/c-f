// commands/fun/debate.js
export default {
    name: "debate",
    alias: ["argue", "discuss", "vs"],
    category: "fun",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `💬 *DEBATE TOPICS* 💬\n\n` +
                      `Usage: ${PREFIX}debate <topic>\n` +
                      `${PREFIX}debate <option1> vs <option2>\n\n` +
                      `Examples:\n` +
                      `• ${PREFIX}debate cats vs dogs\n` +
                      `• ${PREFIX}debate night owl vs early bird\n` +
                      `• ${PREFIX}debate pizza vs burger\n` +
                      `• ${PREFIX}debate online vs offline classes\n` +
                      `• ${PREFIX}debate summer vs winter`
            }, { quoted: m });
        }
        
        const topic = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `⚖️ Preparing debate on: "${topic}"...`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            const prompt = `Create a structured debate about: "${topic}"
            
            Format:
            1. Debate Topic Statement
            2. Side A Arguments (3-4 points)
            3. Side B Arguments (3-4 points)
            4. Counterarguments for each side
            5. Final analysis/verdict
            
            Make it balanced and thought-provoking.`;
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { apikey: 'tkm', text: prompt },
                timeout: 30000
            });
            
            const debate = response.data?.result || response.data?.response;
            
            await sock.sendMessage(jid, {
                text: `⚖️ *DEBATE: ${topic.toUpperCase()}*\n\n${debate}\n\n🎯 What's your stance?`
            }, { quoted: m });
            
        } catch (error) {
            console.error("Debate error:", error);
            await sock.sendMessage(jid, {
                text: `❌ Debate preparation failed\nTry: ${PREFIX}debate <simple topic>`
            }, { quoted: m });
        }
    }
};
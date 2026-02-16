// commands/ai/teach.js - SAME STRUCTURE AS FLUX.JS
export default {
    name: "teach",
    alias: ["teacher", "learn", "tutor", "explain"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        // Show help if no arguments
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `🧑‍🏫 *AI TEACHER* 🧑‍🏫\n\n` +
                      `Usage: ${PREFIX}teach <topic>\n` +
                      `Aliases: ${PREFIX}teacher, ${PREFIX}learn, ${PREFIX}tutor\n\n` +
                      `Examples:\n` +
                      `• ${PREFIX}teach how rainbows form\n` +
                      `• ${PREFIX}teacher basic algebra\n` +
                      `• ${PREFIX}learn about photosynthesis\n\n` +
                      `I'll explain any topic in simple, clear language! 📚`
            }, { quoted: m });
        }
        
        const topic = args.join(' ');
        
        try {
            // Send thinking message (same style as flux.js)
            await sock.sendMessage(jid, {
                text: `🧑‍🏫 Teaching: "${topic}"\n⏳ Preparing your lesson...`
            }, { quoted: m });
            
            // Use the SAME API as your foxai command
            // Dynamically import axios (if not already imported)
            const axios = (await import('axios')).default;
            
            // Call the API (same endpoint as foxai-mini.js)
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { 
                    apikey: 'tkm', 
                    text: `Explain "${topic}" in simple, clear terms. Use everyday language and examples. Avoid technical symbols.`
                },
                timeout: 30000 // 30 second timeout
            });
            
            console.log(`✅ API Response received`);
            
            // Get the answer (same format as foxai-mini.js)
            const answer = response.data?.result || response.data?.response || 
                          `I'll explain ${topic} in simple terms...`;
            
            // Format the lesson nicely
            const lesson = `📚 *Lesson: ${topic}*\n\n` +
                          `${answer}\n\n` +
                          `💡 *Learning Tip:* Try explaining this to someone else to test your understanding!`;
            
            // Send the lesson
            await sock.sendMessage(jid, {
                text: lesson
            }, { quoted: m });
            
            console.log(`✅ Lesson sent for topic: ${topic}`);
            
        } catch (error) {
            console.error("❌ Teach error:", error.message);
            
            let errorMsg = `❌ Teaching session failed\n\n`;
            
            if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
                errorMsg += 'The lesson took too long to prepare.\n';
                errorMsg += 'Try a simpler topic or try again later.';
            } else if (error.message.includes('Network Error')) {
                errorMsg += 'Network connection failed.\n';
                errorMsg += 'Check your internet and try again.';
            } else if (error.response?.status === 404) {
                errorMsg += 'Teaching API not available.\n';
                errorMsg += 'Try: ' + PREFIX + 'search ' + topic;
            } else {
                errorMsg += `Error: ${error.message}\n`;
                errorMsg += 'Try again with a different topic.';
            }
            
            await sock.sendMessage(jid, {
                text: errorMsg
            }, { quoted: m });
        }
    }
};
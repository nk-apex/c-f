// commands/fun/compliment.js
export default {
    name: "compliment",
    alias: ["praise", "nice", "flatter"],
    category: "fun",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        // Check if mentioned someone
        let mentionedUser = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentionedUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        
        try {
            await sock.sendMessage(jid, {
                text: `✨ Finding the perfect compliment...`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            let prompt = "Give me a unique, genuine compliment";
            if (args.length > 0 && !mentionedUser) {
                prompt = `Give a compliment about: ${args.join(' ')}`;
            }
            
            prompt += "\nMake it creative, specific, and heartwarming.";
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { apikey: 'tkm', text: prompt },
                timeout: 10000
            });
            
            const compliment = response.data?.result || response.data?.response;
            
            let message = `💝 *COMPLIMENT*\n\n${compliment}\n\n✨ You're amazing!`;
            
            if (mentionedUser) {
                const username = mentionedUser.split('@')[0];
                message = `💝 @${username}\n\n${compliment}\n\n✨ Someone thinks you're awesome!`;
            }
            
            await sock.sendMessage(jid, {
                text: message,
                mentions: mentionedUser ? [mentionedUser] : []
            }, { quoted: m });
            
        } catch (error) {
            console.error("Compliment error:", error);
            
            const compliments = [
                "You have a great sense of humor! 😄",
                "Your positivity is contagious! 🌟",
                "You're smarter than you think! 🧠",
                "You make people feel comfortable around you! 🤗",
                "Your perspective is always interesting! 💭"
            ];
            
            const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
            
            await sock.sendMessage(jid, {
                text: `💝 *COMPLIMENT*\n\n${randomCompliment}\n\n✨ Have a great day!`
            }, { quoted: m });
        }
    }
};
// commands/tools/translate.js
export default {
    name: "translate",
    alias: ["tr", "trans", "terjemah"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (args.length < 3) {
            return sock.sendMessage(jid, {
                text: `🌍 *TRANSLATOR* 🌍\n\n` +
                      `Usage: ${PREFIX}translate <from> <to> <text>\n` +
                      `${PREFIX}tr id en "Halo dunia"\n\n` +
                      `Language codes:\n` +
                      `• en - English\n` +
                      `• id - Indonesian\n` +
                      `• ja - Japanese\n` +
                      `• ko - Korean\n` +
                      `• es - Spanish\n` +
                      `• fr - French\n` +
                      `• de - German\n\n` +
                      `Examples:\n` +
                      `• ${PREFIX}translate id en "Apa kabar?"\n` +
                      `• ${PREFIX}tr en id "Hello world"\n` +
                      `• ${PREFIX}translate auto id "Bonjour"`
            }, { quoted: m });
        }
        
        const fromLang = args[0].toLowerCase();
        const toLang = args[1].toLowerCase();
        const text = args.slice(2).join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `🔄 Translating...`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            const prompt = `Translate this text from ${fromLang} to ${toLang}:\n\n"${text}"\n\n` +
                          `Provide only the translation, no explanations.`;
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { apikey: 'tkm', text: prompt },
                timeout: 15000
            });
            
            const translation = response.data?.result || response.data?.response;
            
            await sock.sendMessage(jid, {
                text: `🌐 *TRANSLATION*\n\n` +
                      `📥 *${fromLang.toUpperCase()}*: ${text}\n\n` +
                      `📤 *${toLang.toUpperCase()}*: ${translation}\n\n` +
                      `✅ Translated successfully`
            }, { quoted: m });
            
        } catch (error) {
            console.error("Translate error:", error);
            await sock.sendMessage(jid, {
                text: `❌ Translation failed\nFormat: ${PREFIX}translate en id "hello"`
            }, { quoted: m });
        }
    }
};
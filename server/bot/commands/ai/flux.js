export default {
    name: "flux",
    alias: ["ai", "generate", "aiimage"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Flux AI Image*\n` +
                      `\u2502 Usage: ${PREFIX}flux <prompt>\n` +
                      `\u2502 Example: ${PREFIX}flux cute anime cat\n` +
                      `\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const prompt = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Generating...*\n\u2502 Prompt: "${prompt}"\n\u2502 Please wait...\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
            const encodedPrompt = encodeURIComponent(prompt);
            const apiUrl = `https://apiskeith.vercel.app/ai/flux?q=${encodedPrompt}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            if (imageBuffer.length < 1024) {
                throw new Error('Image too small or invalid');
            }
            
            const magicBytes = imageBuffer.slice(0, 4).toString('hex');
            const isJpeg = magicBytes.startsWith('ffd8');
            const isPng = magicBytes.startsWith('89504e47');
            const isWebP = magicBytes.startsWith('52494646');
            const isGif = magicBytes.startsWith('47494638');
            
            if (!isJpeg && !isPng && !isWebP && !isGif) {
                throw new Error('Not a valid image format');
            }
            
            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `\u250C\u2500\u29ED *Flux AI*\n\u2502 ${prompt}\n\u2514\u2500\u29ED`
            });
            
        } catch (error) {
            console.error("Flux error:", error.message);
            
            let errorDetail = error.message;
            if (error.message.includes('timeout')) {
                errorDetail = 'API taking too long. Try a simpler prompt.';
            } else if (error.message.includes('HTTP')) {
                errorDetail = 'Service might be down.';
            } else if (error.message.includes('invalid')) {
                errorDetail = 'Invalid image received. Try again.';
            }
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Failed to generate image\n\u2502 ${errorDetail}\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};
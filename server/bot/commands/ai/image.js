import { foxCanUse, foxMode } from '../../utils/foxMaster.js';
import axios from 'axios';

export default {
    name: 'image',
    alias: ['img', 'pic', 'photo'],
    category: 'tools',
    description: 'Search for images - specify exact count',
    usage: '<query> [1-5]',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'image')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const API_KEY = "Jwc395ntZZYJfjsLIaAWLUZjfVchFbLVzE7DbDBbCeCNSQBx7q7FowDw";
        
        let query = '';
        let count = 1;
        
        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `\u250C\u2500\u29ED *Foxy Image Search*\n` +
                      `\u2502 Usage: ${prefix}image <query> [number]\n` +
                      `\u2502\n` +
                      `\u2502 Examples:\n` +
                      `\u2502 ${prefix}image cat\n` +
                      `\u2502 ${prefix}image sunset 3\n` +
                      `\u2502 ${prefix}img nature\n` +
                      `\u2502\n` +
                      `\u2502 Limit: 1-5 images per request\n` +
                      `\u2502 Powered by Pexels API\n` +
                      `\u2514\u2500\u29ED`
            });
        }
        
        const lastArg = args[args.length - 1];
        const parsedCount = parseInt(lastArg);
        
        if (!isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 5) {
            count = parsedCount;
            args.pop();
            query = args.join(' ');
        } else {
            query = args.join(' ');
        }
        
        if (!query.trim()) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Please provide a search query\n\u2502 ${prefix}image <search term> [1-5]\n\u2514\u2500\u29ED`
            });
        }
        
        const searchMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `\u250C\u2500\u29ED *Searching...*\n\u2502 Query: "${query}"\n\u2502 Sending ${count} image${count > 1 ? 's' : ''}...\n\u2514\u2500\u29ED`
        });
        
        try {
            const response = await axios.get(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
                { 
                    headers: { 
                        Authorization: API_KEY 
                    },
                    timeout: 10000
                }
            );
            
            const photos = response.data.photos;
            
            if (!photos || photos.length === 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `\u250C\u2500\u29ED *Error*\n\u2502 No images found for "${query}"\n\u2502 Try different keywords\n\u2514\u2500\u29ED`
                });
            }
            
            const photosToSend = photos.slice(0, count);
            
            for (let i = 0; i < photosToSend.length; i++) {
                const photo = photosToSend[i];
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: photo.src.large },
                    caption: `\u250C\u2500\u29ED *Foxy Image*\n` +
                            `\u2502 Search: ${query}\n` +
                            `\u2502 Photographer: ${photo.photographer}\n` +
                            `\u2502 Size: ${photo.width}x${photo.height}\n` +
                            `\u2502 ${i+1}/${photosToSend.length}\n` +
                            `\u2514\u2500\u29ED`
                });
                
                if (i < photosToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (count > 1) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `\u250C\u2500\u29ED *Done*\n\u2502 Sent ${photosToSend.length} images for "${query}"\n\u2502 Search again: ${prefix}image <query> [1-5]\n\u2514\u2500\u29ED`
                });
            }
            
        } catch (error) {
            console.error('Image search error:', error.message);
            
            let errorDetail = error.message || 'API error';
            if (error.response?.status === 429) {
                errorDetail = 'API rate limit reached. Try again in 1 hour';
            } else if (error.code === 'ECONNABORTED') {
                errorDetail = 'Request timeout. Try a simpler query';
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Image search failed\n\u2502 ${errorDetail}\n\u2514\u2500\u29ED`
            });
        }
    }
};
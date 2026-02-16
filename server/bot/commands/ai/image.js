// commands/tools/image.js
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
        
        // Parse arguments
        let query = '';
        let count = 1;
        
        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `📸 *FOXY IMAGE SEARCH*\n\n` +
                      `*Usage:* ${prefix}image <query> [number]\n\n` +
                      `*Examples:*\n` +
                      `${prefix}image cat\n` +
                      `${prefix}image sunset 3\n` +
                      `${prefix}img nature\n\n` +
                      `*Limit:* 1-5 images per request\n` +
                      `🦊 Powered by Pexels API`
            });
        }
        
        // Check if last argument is a number
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
                text: `❌ *Please provide a search query*\n\n` +
                      `${prefix}image <your search term> [1-5]`
            });
        }
        
        // Show searching message
        const searchMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `🔍 *FOXY searching for "${query}"...*\n` +
                  `📦 *Sending ${count} image${count > 1 ? 's' : ''}*`
        });
        
        try {
            // Fetch images from Pexels
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
                    text: `❌ *No images found for "${query}"*\n\n` +
                          `Try different keywords:\n` +
                          `${prefix}image nature\n` +
                          `${prefix}image animals\n` +
                          `${prefix}image landscape`
                });
            }
            
            // Send images
            const photosToSend = photos.slice(0, count);
            
            for (let i = 0; i < photosToSend.length; i++) {
                const photo = photosToSend[i];
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: photo.src.large },
                    caption: `📸 *FOXY IMAGE*\n\n` +
                            `*Search:* ${query}\n` +
                            `*Photographer:* ${photo.photographer}\n` +
                            `*Size:* ${photo.width}x${photo.height}\n\n` +
                            `🦊 ${i+1}/${photosToSend.length}`
                });
                
                // Small delay between images
                if (i < photosToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Completion message for multiple images
            if (count > 1) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ *FOXY sent ${photosToSend.length} images for "${query}"*\n\n` +
                          `🦊 Search again: ${prefix}image <query> [1-5]`
                });
            }
            
        } catch (error) {
            console.error('Image search error:', error.message);
            
            let errorMsg = `❌ *FOXY image search failed*\n\n`;
            
            if (error.response?.status === 429) {
                errorMsg += `*Error:* API rate limit reached\n`;
                errorMsg += `Try again in 1 hour`;
            } else if (error.code === 'ECONNABORTED') {
                errorMsg += `*Error:* Request timeout\n`;
                errorMsg += `Try a simpler query`;
            } else {
                errorMsg += `*Error:* ${error.message || 'API error'}\n`;
                errorMsg += `Try: ${prefix}image cat`;
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: errorMsg
            });
        }
    }
};
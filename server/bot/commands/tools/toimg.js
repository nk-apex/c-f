// commands/tools/toimg.js - UPDATED VERSION
export default {
    name: "toimg",
    alias: ["toimage", "img", "unsticker"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        console.log('🖼️ [TOIMG] Command triggered');
        
        const jid = m.key.remoteJid;
        let processingMsg = null;
        
        try {
            // Check for sticker in different ways
            let stickerMessage = null;
            
            // Method 1: Check if message is a reply to a sticker
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quoted.stickerMessage) {
                    stickerMessage = quoted.stickerMessage;
                    console.log('🖼️ [TOIMG] Found sticker in quoted message');
                }
            }
            
            // Method 2: Check if message itself contains a sticker
            if (!stickerMessage && m.message?.stickerMessage) {
                stickerMessage = m.message.stickerMessage;
                console.log('🖼️ [TOIMG] Found sticker in message itself');
            }
            
            if (!stickerMessage) {
                await sock.sendMessage(jid, { 
                    text: `🖼️ *Sticker to Image*\n\n` +
                          `Usage:\n` +
                          `• Reply to a sticker with \`${PREFIX}toimg\`\n` +
                          `• Or send sticker with caption \`${PREFIX}toimg\`\n\n` +
                          `📌 *Supported:*\n` +
                          `• WhatsApp stickers (WebP format)\n` +
                          `• Animated stickers (will be converted to GIF)\n` +
                          `• Static stickers (will be converted to PNG)`
                }, { quoted: m });
                return;
            }

            // Check if it's animated
            const isAnimated = stickerMessage.isAnimated || 
                              (stickerMessage.pseconds && stickerMessage.pseconds > 0) || 
                              false;
            
            console.log(`🖼️ [TOIMG] Sticker type: ${isAnimated ? 'Animated' : 'Static'}`);
            
            // Send initial processing message
            processingMsg = await sock.sendMessage(jid, { 
                text: `⏳ *Converting sticker to image...*\n\n` +
                      `📊 *Type:* ${isAnimated ? 'Animated (GIF)' : 'Static (PNG)'}\n` +
                      `⚙️ *Downloading...*` 
            }, { quoted: m });

            console.log(`🖼️ [TOIMG] Downloading sticker...`);
            
            // Dynamically import the required function
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            
            // Download sticker with timeout
            const downloadTimeout = setTimeout(async () => {
                try {
                    await sock.sendMessage(jid, { 
                        text: `⚠️ *Download taking too long*\n\n` +
                              `• Trying alternative method...\n` +
                              `• Large animated stickers may take longer`
                    });
                } catch (e) {}
            }, 10000);
            
            let buffer = Buffer.from([]);
            try {
                const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
                
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                clearTimeout(downloadTimeout);
            } catch (downloadError) {
                clearTimeout(downloadTimeout);
                throw new Error(`Download failed: ${downloadError.message}`);
            }

            console.log(`🖼️ [TOIMG] Sticker downloaded: ${(buffer.length / 1024).toFixed(1)}KB`);
            
            // Update processing message
            if (processingMsg) {
                await sock.sendMessage(jid, { 
                    text: `⏳ *Converting sticker to image...*\n\n` +
                          `📊 *Type:* ${isAnimated ? 'Animated (GIF)' : 'Static (PNG)'}\n` +
                          `✅ *Downloaded:* ${(buffer.length / 1024).toFixed(1)}KB\n` +
                          `⚙️ *Processing...*`,
                    edit: processingMsg.key
                });
            }

            // Process the sticker
            let resultBuffer;
            let format;
            let metadata = null;
            
            // Try to extract metadata first (non-blocking)
            try {
                const { Image } = (await import('node-webpmux')).default;
                const img = new Image();
                await img.load(buffer);
                
                if (img.exif) {
                    try {
                        const jsonString = img.exif.slice(22).toString('utf8');
                        metadata = JSON.parse(jsonString);
                        console.log('🖼️ [TOIMG] Found sticker metadata');
                    } catch (e) {
                        console.log('🖼️ [TOIMG] No valid metadata found');
                    }
                }
            } catch (e) {
                console.log('🖼️ [TOIMG] Metadata extraction skipped:', e.message);
            }

            if (isAnimated) {
                // Handle animated sticker
                console.log('🖼️ [TOIMG] Processing animated sticker...');
                
                // Update message
                if (processingMsg) {
                    await sock.sendMessage(jid, { 
                        text: `⏳ *Converting sticker to image...*\n\n` +
                              `📊 *Type:* Animated (GIF)\n` +
                              `✅ *Downloaded:* ${(buffer.length / 1024).toFixed(1)}KB\n` +
                              `🔄 *Converting WebP to GIF...*`,
                        edit: processingMsg.key
                    });
                }
                
                format = 'gif';
                
                try {
                    // Method 1: Try sharp for conversion
                    const sharp = (await import('sharp')).default;
                    
                    // Check if sharp supports animated WebP
                    const sharpBuffer = buffer;
                    const sharpInstance = sharp(sharpBuffer, { 
                        animated: true,
                        limitInputPixels: false 
                    });
                    
                    // Get frame count
                    const metadata = await sharpInstance.metadata();
                    console.log(`🖼️ [TOIMG] Frame count: ${metadata.pages || 1}`);
                    
                    // Convert to GIF
                    resultBuffer = await sharpInstance
                        .gif({
                            loop: 0,
                            delay: stickerMessage.pseconds ? 
                                   Math.max(20, Math.floor(stickerMessage.pseconds * 1000)) : 
                                   100,
                            dither: 0.5,
                            effort: 2 // Lower effort for faster processing
                        })
                        .toBuffer();
                        
                    console.log(`✅ [TOIMG] Converted to GIF: ${(resultBuffer.length / 1024).toFixed(1)}KB`);
                    
                } catch (sharpError) {
                    console.log('🖼️ [TOIMG] Sharp animation conversion failed:', sharpError.message);
                    
                    // Method 2: If sharp fails, send as WebP video
                    format = 'webp';
                    resultBuffer = buffer;
                    
                    // Update message
                    if (processingMsg) {
                        await sock.sendMessage(jid, { 
                            text: `⏳ *Converting sticker to image...*\n\n` +
                                  `📊 *Type:* Animated (WebP)\n` +
                                  `✅ *Downloaded:* ${(buffer.length / 1024).toFixed(1)}KB\n` +
                                  `⚠️ *GIF conversion failed, sending as WebP video*`,
                            edit: processingMsg.key
                        });
                    }
                }
            } else {
                // Handle static sticker
                console.log('🖼️ [TOIMG] Processing static sticker...');
                
                // Update message
                if (processingMsg) {
                    await sock.sendMessage(jid, { 
                        text: `⏳ *Converting sticker to image...*\n\n` +
                              `📊 *Type:* Static (PNG)\n` +
                              `✅ *Downloaded:* ${(buffer.length / 1024).toFixed(1)}KB\n` +
                              `🔄 *Converting WebP to PNG...*`,
                        edit: processingMsg.key
                    });
                }
                
                format = 'png';
                
                try {
                    // Try using sharp for conversion
                    const sharp = (await import('sharp')).default;
                    
                    resultBuffer = await sharp(buffer)
                        .png({
                            quality: 90,
                            compressionLevel: 6,
                            progressive: true,
                            palette: true,
                            colors: 128
                        })
                        .toBuffer();
                        
                    console.log(`✅ [TOIMG] Converted to PNG: ${(resultBuffer.length / 1024).toFixed(1)}KB`);
                    
                } catch (sharpError) {
                    console.log('🖼️ [TOIMG] Sharp conversion failed:', sharpError.message);
                    
                    // Fallback: Use webpmux or send original
                    try {
                        const { Image } = (await import('node-webpmux')).default;
                        const img = new Image();
                        await img.load(buffer);
                        
                        // Extract first frame
                        resultBuffer = await img.getFrame(0);
                        console.log(`✅ [TOIMG] Extracted PNG via webpmux: ${(resultBuffer.length / 1024).toFixed(1)}KB`);
                    } catch (webpError) {
                        console.log('🖼️ [TOIMG] WebP extraction failed, sending original');
                        resultBuffer = buffer;
                        format = 'webp';
                    }
                }
            }

            // Prepare final message
            let caption = `✅ *Sticker Converted to Image!*\n\n`;
            caption += `📊 *Format:* ${format.toUpperCase()}\n`;
            caption += `📦 *Size:* ${(resultBuffer.length / 1024).toFixed(1)}KB\n`;
            
            if (metadata) {
                caption += `\n📋 *Sticker Info:*\n`;
                if (metadata['sticker-pack-name']) {
                    caption += `• *Pack:* ${metadata['sticker-pack-name']}\n`;
                }
                if (metadata['sticker-pack-publisher']) {
                    caption += `• *Author:* ${metadata['sticker-pack-publisher']}\n`;
                }
                if (metadata.emojis && metadata.emojis.length > 0) {
                    caption += `• *Emoji:* ${metadata.emojis.join(' ')}\n`;
                }
            }
            
            if (isAnimated) {
                caption += `\n🎬 *Animation:* ${format === 'gif' ? 'Converted to GIF' : 'Original WebP'}\n`;
                if (stickerMessage.pseconds) {
                    caption += `• *Frame delay:* ${stickerMessage.pseconds}s\n`;
                }
            }
            
            // Delete processing message
            try {
                if (processingMsg) {
                    await sock.sendMessage(jid, {
                        delete: processingMsg.key
                    });
                }
            } catch (e) {}
            
            // Send the final result
            if (format === 'gif') {
                // Send as GIF
                await sock.sendMessage(jid, {
                    video: resultBuffer,
                    caption: caption,
                    gifPlayback: true,
                    mimetype: 'image/gif'
                }, { quoted: m });
            } else if (format === 'webp' && isAnimated) {
                // Send animated WebP as video
                await sock.sendMessage(jid, {
                    video: resultBuffer,
                    caption: caption,
                    mimetype: 'video/webm'
                }, { quoted: m });
            } else {
                // Send as image
                await sock.sendMessage(jid, {
                    image: resultBuffer,
                    caption: caption,
                    mimetype: format === 'webp' ? 'image/webp' : 'image/png'
                }, { quoted: m });
            }
            
            console.log(`✅ [TOIMG] Conversion completed successfully`);

        } catch (error) {
            console.error('❌ [TOIMG] Error:', error);
            
            // Delete processing message if exists
            try {
                if (processingMsg) {
                    await sock.sendMessage(jid, {
                        delete: processingMsg.key
                    });
                }
            } catch (e) {}
            
            let errorMsg = `❌ *Failed to convert sticker*\n\n`;
            
            if (error.message.includes('timeout') || error.message.includes('too long')) {
                errorMsg += `⚠️ *Processing timeout*\n\n`;
                errorMsg += `• Animated stickers can take time\n`;
                errorMsg += `• Try with smaller stickers\n`;
                errorMsg += `• Static stickers convert faster\n\n`;
                errorMsg += `💡 *Alternative:*\n`;
                errorMsg += `• Save sticker manually\n`;
                errorMsg += `• Use screenshot for static stickers`;
            } else if (error.message.includes('sharp') || error.message.includes('Vips')) {
                errorMsg += `⚠️ *Image processing error*\n\n`;
                errorMsg += `• Sharp not installed or misconfigured\n`;
                errorMsg += `• Install: \`npm install sharp\`\n\n`;
                errorMsg += `💡 *Without sharp:*\n`;
                errorMsg += `• Only static stickers will work\n`;
                errorMsg += `• Animated stickers need sharp`;
            } else if (error.message.includes('WebP') || error.message.includes('webp')) {
                errorMsg += `⚠️ *WebP format error*\n\n`;
                errorMsg += `• Sticker might be corrupted\n`;
                errorMsg += `• Unsupported WebP version\n\n`;
                errorMsg += `💡 *Try:*\n`;
                errorMsg += `• Different sticker\n`;
                errorMsg += `• Static sticker instead`;
            } else {
                errorMsg += `⚠️ *Error:* ${error.message}\n\n`;
                errorMsg += `💡 *Try:*\n`;
                errorMsg += `• Different sticker\n`;
                errorMsg += `• Check internet connection\n`;
                errorMsg += `• Contact developer if persists`;
            }
            
            await sock.sendMessage(jid, { 
                text: errorMsg
            }, { quoted: m });
        }
    }
};
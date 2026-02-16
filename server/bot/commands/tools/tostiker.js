// commands/tools/tosticker.js - FIXED VERSION
export default {
    name: "tosticker",
    alias: ["sticker", "s", "stick"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        console.log('🎨 [TOSTICKER] Command triggered');
        
        const jid = m.key.remoteJid;
        
        try {
            // Check for image in different ways
            let imageMessage = null;
            
            // Method 1: Check if message is a reply to an image
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quoted.imageMessage) {
                    imageMessage = quoted.imageMessage;
                    console.log('🎨 [TOSTICKER] Found image in quoted message');
                } else if (quoted.documentMessage?.mimetype?.startsWith('image/')) {
                    imageMessage = quoted.documentMessage;
                    console.log('🎨 [TOSTICKER] Found image document in quoted message');
                }
            }
            
            // Method 2: Check if message itself contains an image
            if (!imageMessage && m.message?.imageMessage) {
                imageMessage = m.message.imageMessage;
                console.log('🎨 [TOSTICKER] Found image in message itself');
            }
            
            // Method 3: Check if message contains image document
            if (!imageMessage && m.message?.documentMessage?.mimetype?.startsWith('image/')) {
                imageMessage = m.message.documentMessage;
                console.log('🎨 [TOSTICKER] Found image document in message');
            }
            
            if (!imageMessage) {
                await sock.sendMessage(jid, { 
                    text: `🎨 *Image to Sticker*\n\n` +
                          `Usage:\n` +
                          `• Reply to an image with \`${PREFIX}tosticker\`\n` +
                          `• Or send image with caption \`${PREFIX}tosticker\`\n\n` +
                          `📌 *Supported:*\n` +
                          `• JPG, PNG, GIF, WebP\n` +
                          `• Max size: 3MB`
                }, { quoted: m });
                return;
            }

            // Get emoji from args (first arg) or use default
            const emoji = args[0] || '🤖';
            const packName = 'foxybot'; // Always use foxyBot as pack name
            const authorName = m.pushName || 'User'; // Use sender's name as author
            
            await sock.sendMessage(jid, { 
                text: `⏳ *Creating foxybot sticker...*\n\n` +
                      `📦 *Pack:* ${packName}\n` +
                      `👤 *By:* ${authorName}\n` +
                      `🎭 *Emoji:* ${emoji}` 
            }, { quoted: m });

            console.log(`🎨 [TOSTICKER] Downloading image...`);
            
            // Dynamically import the required function
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            
            // Determine download type
            const downloadType = imageMessage.mimetype?.startsWith('image/') ? 'image' : 
                                (imageMessage.jpegThumbnail ? 'image' : 'document');
            
            console.log(`🎨 [TOSTICKER] Download type: ${downloadType}`);
            
            // Download image
            const stream = await downloadContentFromMessage(imageMessage, downloadType);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            console.log(`🎨 [TOSTICKER] Image downloaded: ${(buffer.length / 1024).toFixed(1)}KB`);
            
            // Check size limit
            if (buffer.length > 1024 * 1024 * 3) { // 3MB limit
                await sock.sendMessage(jid, { 
                    text: `⚠️ *Image too large*\n\n` +
                          `• Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB\n` +
                          `• Max: 3MB\n\n` +
                          `💡 *Try:*\n` +
                          `• Smaller image\n` +
                          `• Compress image first`
                }, { quoted: m });
                return;
            }

            console.log(`🎨 [TOSTICKER] Converting to WebP...`);
            
            try {
                // Dynamically import sharp
                const sharp = (await import('sharp')).default;
                
                // Process image with sharp
                let processedImage = sharp(buffer);
                
                // Auto-rotate based on EXIF
                processedImage = processedImage.rotate();
                
                // Get metadata for resizing
                const metadata = await sharp(buffer).metadata().catch(() => ({ width: 0, height: 0 }));
                
                // Resize maintaining aspect ratio (max 512x512 for WhatsApp stickers)
                const maxSize = 512;
                if (metadata.width > maxSize || metadata.height > maxSize) {
                    processedImage = processedImage.resize(maxSize, maxSize, {
                        fit: 'inside',
                        withoutEnlargement: true,
                        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
                    });
                }
                
                // Convert to WebP
                const webpBuffer = await processedImage
                    .webp({ 
                        quality: 80,
                        lossless: false,
                        nearLossless: true,
                        alphaQuality: 80,
                        effort: 4
                    })
                    .toBuffer();
                
                console.log(`✅ [TOSTICKER] WebP created: ${(webpBuffer.length / 1024).toFixed(1)}KB`);
                
                // Try to add metadata if node-webpmux is available
                let finalSticker = webpBuffer;
                
                try {
                    // Dynamically import webp
                    const { Image } = (await import('node-webpmux')).default;
                    const crypto = await import('crypto');
                    
                    console.log(`🎨 [TOSTICKER] Adding foxybot metadata...`);
                    finalSticker = await addStickerMetadata(webpBuffer, {
                        packName: packName,
                        authorName: authorName,
                        emoji: emoji
                    }, Image, crypto);
                    
                } catch (metadataError) {
                    console.log(`⚠️ [TOSTICKER] Metadata not added: ${metadataError.message}`);
                    // Continue without metadata
                }
                
                const finalSizeKB = (finalSticker.length / 1024).toFixed(1);
                console.log(`✅ [TOSTICKER] Final sticker: ${finalSizeKB}KB`);
                
                // Send the sticker
                await sock.sendMessage(jid, {
                    sticker: finalSticker
                }, { quoted: m });
                
                console.log(`✅ [TOSTICKER] foxybot sticker sent successfully`);
                
                // Send confirmation message
                await sock.sendMessage(jid, { 
                    text: `✅ *WolfBot Sticker Created!*\n\n` +
                          `📦 *Pack:* ${packName}\n` +
                          `👤 *By:* ${authorName}\n` +
                          `🎭 *Emoji:* ${emoji}\n` +
                          `📊 *Size:* ${finalSizeKB}KB\n\n` +
                          `💡 *To save:*\n` +
                          `1. Long press sticker\n` +
                          `2. Tap "Add to sticker pack"\n` +
                          `3. It will appear under "foxybot" pack`
                });
                
            } catch (sharpError) {
                console.error(`❌ [TOSTICKER] Sharp processing error:`, sharpError);
                
                // Send original image as sticker (WhatsApp might convert it)
                await sock.sendMessage(jid, {
                    sticker: buffer
                }, { quoted: m });
                
                await sock.sendMessage(jid, { 
                    text: `✅ *Basic Sticker Created*\n\n` +
                          `💡 *Note:* Created basic sticker\n` +
                          `• Install sharp for better quality: \`npm install sharp\`\n` +
                          `• Install webpmux for pack metadata: \`npm install node-webpmux\``
                });
            }

        } catch (error) {
            console.error('❌ [TOSTICKER] Error:', error);
            
            let errorMsg = `❌ *Failed to create sticker*\n\n⚠️ *Error:* ${error.message}\n\n`;
            
            if (error.message.includes('downloadContentFromMessage')) {
                errorMsg += `• Could not download image\n`;
                errorMsg += `• Make sure image is not corrupted\n`;
            } else if (error.message.includes('sharp') || error.message.includes('libvips')) {
                errorMsg += `• Sharp not installed\n`;
                errorMsg += `• Install: \`npm install sharp\`\n`;
            } else if (error.message.includes('node-webpmux') || error.message.includes('webp')) {
                errorMsg += `• WebP library not available\n`;
                errorMsg += `• Install: \`npm install node-webpmux\`\n`;
            } else if (error.message.includes('size') || error.message.includes('large')) {
                errorMsg += `• Image file is too large\n`;
                errorMsg += `• Maximum size: 3MB\n`;
            }
            
            errorMsg += `\n💡 *Workaround:*\n`;
            errorMsg += `• Send image normally\n`;
            errorMsg += `• Use WhatsApp's built-in sticker maker\n`;
            errorMsg += `• Or install required packages`;
            
            await sock.sendMessage(jid, { 
                text: errorMsg
            }, { quoted: m });
        }
    }
};

// Function to add sticker metadata
async function addStickerMetadata(webpBuffer, metadata, Image, crypto) {
    try {
        const { packName, authorName, emoji } = metadata;
        
        // Create webp image object
        const img = new Image();
        await img.load(webpBuffer);
        
        // Create metadata JSON
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packName,
            'sticker-pack-publisher': authorName,
            'emojis': [emoji]
        };
        
        // Create EXIF buffer with metadata
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        
        // Set the EXIF data
        img.exif = exif;
        
        // Get final buffer with metadata
        const finalBuffer = await img.save(null);
        return finalBuffer;
        
    } catch (error) {
        console.error('❌ [METADATA] Error adding metadata:', error);
        // Return original buffer if metadata addition fails
        return webpBuffer;
    }
}


















import { downloadContentFromMessage } from '@whiskeysockets/baileys';
let sharp;
try { sharp = (await import('sharp')).default; } catch { sharp = null; }
import webp from 'node-webpmux';
import crypto from 'crypto';
import { getBotName } from '../../lib/botname.js';

export default {
  name: 'tosticker',
  description: `Convert image to sticker with ${getBotName()} metadata`,
  category: 'converter',

  async execute(sock, m, args) {
    console.log('🎨 [TOSTICKER] Command triggered');
    
    const jid = m.key.remoteJid;
    const prefix = '#';
    
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
          text: `┌─⧭ 🎨 *IMAGE TO STICKER* \n├◆ Usage: *${PREFIX}tosticker <text>*\n├◆ Convert image to sticker with ${getBotName()} metadata\n└─⧭`
        }, { quoted: m });
        return;
      }

      // Get emoji from args (first arg) or use default
      const emoji = args[0] || '🤖';
      const packName = getBotName();
      const authorName = m.pushName || 'User'; // Use sender's name as author
      
    //   await sock.sendMessage(jid, { 
    //     text: `⏳ *Creating WolfBot sticker...*\n\n📦 *Pack:* ${packName}\n👤 *By:* ${authorName}\n🎭 *Emoji:* ${emoji}` 
    //   }, { quoted: m });

      console.log(`🎨 [TOSTICKER] Downloading image...`);
      
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
          text: `⚠️ *Image too large*\n• Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB\n• Max: 3MB\n\n💡 *Try:*\n• Smaller image\n• Compress image first`
        }, { quoted: m });
        return;
      }

      console.log(`🎨 [TOSTICKER] Converting to WebP...`);
      
      if (!sharp) throw new Error('sharp module not available on this platform');
      
      // Process image with sharp
      let processedImage;
      try {
        processedImage = sharp(buffer);
        
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
        
        // Add WolfBot metadata to sticker
        console.log(`🎨 [TOSTICKER] Adding WolfBot metadata...`);
        const finalSticker = await addStickerMetadata(webpBuffer, {
          packName: packName,
          authorName: authorName,
          emoji: emoji
        });
        
        const finalSizeKB = (finalSticker.length / 1024).toFixed(1);
        console.log(`✅ [TOSTICKER] Sticker with metadata: ${finalSizeKB}KB`);
        
        // Send the sticker
        await sock.sendMessage(jid, {
          sticker: finalSticker
        }, { quoted: m });
        
        console.log(`✅ [TOSTICKER] WolfBot sticker sent successfully`);
        
        // Send confirmation message
        // await sock.sendMessage(jid, { 
        //   text: `✅ *WolfBot Sticker Created!*\n\n📦 *Pack:* ${packName}\n👤 *By:* ${authorName}\n🎭 *Emoji:* ${emoji}\n📊 *Size:* ${finalSizeKB}KB\n\n💡 *To save:*\n1. Long press sticker\n2. Tap "Add to sticker pack"\n3. It will appear under "WolfBot" pack`
        // }, { quoted: m });
        
      } catch (sharpError) {
        console.error(`❌ [TOSTICKER] Sharp processing error:`, sharpError);
        
        // Fallback: Try simple conversion without metadata
        try {
          console.log(`🎨 [TOSTICKER] Trying fallback conversion...`);
          const simpleSticker = await sharp(buffer)
            .resize(256, 256, { fit: 'inside' })
            .webp({ quality: 70 })
            .toBuffer();
          
          await sock.sendMessage(jid, {
            sticker: simpleSticker
          }, { quoted: m });
          
          console.log(`✅ [TOSTICKER] Fallback sticker sent`);
          
          await sock.sendMessage(jid, { 
            text: `✅ *Basic Sticker Created*\n\n💡 *Note:* Created basic sticker\n• Pack metadata not added\n• Use \`npm install node-webpmux\` for full features`
          }, { quoted: m });
          
        } catch (fallbackError) {
          throw new Error(`Image processing failed: ${fallbackError.message}`);
        }
      }

    } catch (error) {
      console.error('❌ [TOSTICKER] Error:', error);
      
      let errorMsg = `❌ *Failed to create sticker*\n\n⚠️ *Error:* ${error.message}`;
      
      if (error.message.includes('downloadContentFromMessage')) {
        errorMsg += "\n• Could not download image";
        errorMsg += "\n• Make sure image is not corrupted";
      } else if (error.message.includes('sharp') || error.message.includes('libvips')) {
        errorMsg += "\n• Image processing error";
        errorMsg += "\n• Try different image format";
      } else if (error.message.includes('node-webpmux') || error.message.includes('webp')) {
        errorMsg += "\n• Sticker metadata error";
        errorMsg += "\n• Install: `npm install node-webpmux`";
      } else if (error.message.includes('size') || error.message.includes('large')) {
        errorMsg += "\n• Image file is too large";
        errorMsg += "\n• Maximum size: 3MB";
      }
      
      errorMsg += "\n\n💡 *Tips:*\n• Use common formats: JPG, PNG\n• Keep size under 3MB\n• Square images work best";
      
      await sock.sendMessage(jid, { 
        text: errorMsg
      }, { quoted: m });
    }
  }
};

// Function to add sticker metadata (WolfBot pack name)
async function addStickerMetadata(webpBuffer, metadata) {
  try {
    const { packName, authorName, emoji } = metadata;
    
    // Create webp image object
    const img = new webp.Image();
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































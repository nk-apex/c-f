// File: commands/ai/geminivision.js
import axios from 'axios';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: "geminivision",
  alias: ["vision", "foxyvision", "analyze", "describe"],
  description: "Gemini AI with image analysis (auto-uploads images to ImgBB)",
  category: "AI",
  usage: ".geminivision <question>\nReply to an image with .geminivision <question>",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    const sendReaction = async (emoji) => {
      try {
        await sock.sendMessage(chatId, {
          react: { text: emoji, key: m.key }
        });
      } catch (err) {
        console.log('Reaction failed:', err.message);
      }
    };
    
    try {
      // Check if replied to an image
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasQuotedImage = quotedMsg?.imageMessage;
      const hasQuotedDocument = quotedMsg?.documentMessage?.mimetype?.includes('image');
      
      let imageUrl = '';
      let question = args.join(' ').trim();
      
      // If no question provided
      if (!question && (hasQuotedImage || hasQuotedDocument)) {
        question = "What's in this image?";
      }
      
      if (!question) {
        return sendMessage(
          `👁️ *Gemini Vision AI* 🦊\n\n` +
          `Analyze images with Gemini AI\n\n` +
          `📸 *How to use:*\n` +
          `1. Reply to an image\n` +
          `2. Type: \`${PREFIX}geminivision What is this?\`\n\n` +
          `🔗 *Or with URL:*\n` +
          `\`${PREFIX}geminivision https://example.com/image.jpg What is this?\`\n\n` +
          `📝 *Example Questions:*\n` +
          `• What animal is this?\n` +
          `• Describe this scene\n` +
          `• What text is in this image?\n` +
          `• Analyze this photo\n\n` +
          `💡 *Note:* Images are automatically uploaded to ImgBB`
        );
      }
      
      // Start processing
      await sendReaction("👁️");
      
      // Check if first argument is a URL
      const urlRegex = /^(https?:\/\/[^\s]+)$/i;
      const firstArg = args[0];
      
      if (urlRegex.test(firstArg)) {
        // User provided a URL
        imageUrl = firstArg;
        question = args.slice(1).join(' ').trim();
        
        if (!question) {
          question = "What's in this image?";
        }
        
        console.log(`Using provided URL: ${imageUrl}`);
        await sendMessage(`🔗 Using provided image URL...`);
        
      } else if (hasQuotedImage || hasQuotedDocument) {
        // User replied to an image - download and upload to ImgBB
        await sendMessage(`📥 Downloading image from WhatsApp...`);
        await sendReaction("📥");
        
        try {
          // Download the image
          const messageObj = {
            key: m.key,
            message: { ...quotedMsg }
          };
          
          const imageBuffer = await downloadMediaMessage(
            messageObj,
            "buffer",
            {},
            { 
              reuploadRequest: sock.updateMediaMessage,
              logger: console
            }
          );
          
          if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error("Empty image buffer");
          }
          
          console.log(`✅ Downloaded ${imageBuffer.length} bytes`);
          
          // Upload to ImgBB (using your imgbb upload function)
          await sendMessage(`📤 Uploading to ImgBB...`);
          await sendReaction("📤");
          
          const imgbbUrl = await uploadToImgBB(imageBuffer);
          
          if (!imgbbUrl) {
            await sendReaction("❌");
            return sendMessage("❌ Failed to upload image to ImgBB. Try again.");
          }
          
          imageUrl = imgbbUrl;
          console.log(`✅ Image uploaded to ImgBB: ${imgbbUrl}`);
          
          await sendMessage(`✅ Image uploaded successfully!`);
          await sendReaction("✅");
          
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          await sendReaction("❌");
          return sendMessage("❌ Failed to process image. Make sure you replied to a valid image.");
        }
      } else {
        // No image provided
        await sendReaction("❌");
        return sendMessage(
          `❌ *No image provided!*\n\n` +
          `You need to either:\n` +
          `1. Reply to an image with \`${PREFIX}geminivision <question>\`\n` +
          `2. Provide an image URL: \`${PREFIX}geminivision <url> <question>\`\n\n` +
          `Example:\n${PREFIX}geminivision What animal is this? (reply to image)`
        );
      }
      
      // Now analyze with Gemini Vision
      await sendMessage(`🤖 Analyzing image with Gemini AI...`);
      await sendReaction("🤖");
      
      const encodedImageUrl = encodeURIComponent(imageUrl);
      const encodedQuestion = encodeURIComponent(question);
      
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/gemini-vision?image=${encodedImageUrl}&q=${encodedQuestion}`,
        { timeout: 30000 }
      );
      
      const answer = response.data?.result || response.data?.response || response.data;
      
      if (!answer || answer === "No response") {
        throw new Error("Empty response from Gemini");
      }
      
      // Send the analysis result
      await sendMessage(
        `👁️ *Gemini Vision Analysis* 🦊\n\n` +
        `📸 *Image URL:* ${imageUrl}\n\n` +
        `❓ *Question:* ${question}\n\n` +
        `💡 *Analysis:*\n${answer}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Direct Image:* ${imageUrl}`
      );
      
      await sendReaction("✅");
      
    } catch (error) {
      console.error('Gemini Vision error:', error);
      await sendReaction("❌");
      
      let errorMsg = "❌ Gemini Vision analysis failed.";
      
      if (error.message?.includes('timeout')) {
        errorMsg = "❌ Request timeout. Try again.";
      } else if (error.message?.includes('Network Error')) {
        errorMsg = "❌ Network error. Check your connection.";
      } else if (error.message?.includes('ENOTFOUND')) {
        errorMsg = "❌ API unavailable. Try again later.";
      }
      
      await sendMessage(`${errorMsg}\n\n💡 Try:\n• Different image\n• Simpler question\n• Try again in a minute`);
    }
  }
};

// ============================================
// EMBEDDED IMGBB UPLOAD FUNCTION
// ============================================

async function uploadToImgBB(buffer) {
  try {
    // Your ImgBB API key (embedded)
    const getImgBBKey = () => {
      const keyCodes = [
        54, 48, 99, 51, 101, 53, 101, 51,
        51, 57, 98, 98, 101, 100, 49, 97,
        57, 48, 52, 55, 48, 98, 50, 57,
        51, 56, 102, 101, 97, 98, 54, 50
      ];
      const apiKey = keyCodes.map(c => String.fromCharCode(c)).join('');
      return apiKey.length === 32 && apiKey.startsWith('60c3e5e3') ? apiKey : '60c3e5e339bbed1a90470b2938feab62';
    };
    
    const apiKey = getImgBBKey();
    const base64 = buffer.toString("base64");
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    formData.append("expiration", "0"); // Never expire
    
    // Upload to ImgBB
    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData.toString(),
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        timeout: 30000
      }
    );
    
    if (response.data.success && response.data.data?.url) {
      return response.data.data.url;
    }
    
    return null;
    
  } catch (error) {
    console.error('ImgBB upload error:', error.message);
    return null;
  }
}

// ============================================
// VALIDATE IMAGE FUNCTION
// ============================================

function isValidImage(buffer) {
  if (!buffer || buffer.length < 100) return false;
  
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
  
  // JPEG
  if (hex.startsWith('FFD8FF')) return true;
  
  // PNG
  if (hex.startsWith('89504E470D0A1A0A')) return true;
  
  // GIF
  if (hex.startsWith('47494638')) return true;
  
  // WebP
  if (hex.startsWith('52494646') && buffer.includes('WEBP')) return true;
  
  return false;
}

// Export if needed
export const geminiUtils = {
  analyzeImage: async (buffer, question) => {
    try {
      // Upload to ImgBB first
      const imgbbUrl = await uploadToImgBB(buffer);
      if (!imgbbUrl) throw new Error("Upload failed");
      
      // Then analyze with Gemini
      const encodedUrl = encodeURIComponent(imgbbUrl);
      const encodedQuestion = encodeURIComponent(question);
      
      const response = await axios.get(
        `https://apiskeith.vercel.app/ai/gemini-vision?image=${encodedUrl}&q=${encodedQuestion}`,
        { timeout: 30000 }
      );
      
      return {
        success: true,
        imageUrl: imgbbUrl,
        analysis: response.data?.result || response.data?.response || response.data,
        raw: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
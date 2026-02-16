import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "imgbb",
  alias: ["upload", "imgurl", "foxypic", "imagehost"], // Added foxypic alias
  description: "Convert replied image to ImgBB URL directly",
  category: "utility",
  usage: ".imgbb\nReply to an image with .imgbb to get a direct URL",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text, editKey = null) => {
      const options = { quoted: m };
      if (editKey) options.edit = editKey;
      return await sock.sendMessage(chatId, { text }, options);
    };
    
    try {
      // Check if message is a reply to an image
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted?.imageMessage) {
        return await sendMessage(
          `📸 *Foxy Image Uploader* 🦊\n\n` +
          `Reply to an image with \`${PREFIX}imgbb\` to get a direct URL.\n\n` +
          `✅ *Features:*\n` +
          `• Permanent image URLs\n` +
          `• Direct image links\n` +
          `• High quality storage\n` +
          `• No expiration\n` +
          `• Free hosting\n\n` +
          `📝 *Usage:*\n` +
          `1. Reply to an image\n` +
          `2. Type: \`${PREFIX}imgbb\`\n` +
          `3. Get direct URL instantly\n\n` +
          `💡 *Note:* Works with images up to 32MB`
        );
      }

      // Get API key
      const apiKey = getImgBBKey();
      
      if (!apiKey || apiKey.length !== 32) {
        return await sendMessage(
          `❌ *API Key Issue* 🦊\n\n` +
          `The ImgBB API key is not properly configured.\n\n` +
          `🔧 *Contact the bot owner for help.*`
        );
      }

      // Log the action
      const senderJid = m.key.participant || chatId;
      const cleaned = jidManager.cleanJid(senderJid);
      console.log(`🦊 Image upload requested by: ${cleaned.cleanNumber || 'Unknown'}`);

      // Send initial processing message
      const processingMsg = await sendMessage("⏳ *Downloading image from WhatsApp...* 🦊");

      // Download image from WhatsApp
      let imageBuffer;
      try {
        console.log("🦊 Downloading image via Baileys...");
        
        // Create message object for download
        const messageObj = {
          key: m.key,
          message: { ...quoted }
        };
        
        imageBuffer = await downloadMediaMessage(
          messageObj,
          "buffer",
          {},
          { 
            reuploadRequest: sock.updateMediaMessage,
            logger: console
          }
        );

        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error("Received empty image buffer");
        }

        console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

      } catch (err) {
        console.error("❌ Download Error:", err.message);
        return await sendMessage(
          `❌ *Failed to download image* 🦊\n\n` +
          `Possible reasons:\n` +
          `• Image might be too old\n` +
          `• Media encryption issue\n` +
          `• Try sending the image again\n\n` +
          `💡 *Tip:* Send a fresh image for best results`,
          processingMsg.key
        );
      }

      // Check file size (ImgBB limit is 32MB)
      const fileSizeMB = imageBuffer.length / (1024 * 1024);
      if (fileSizeMB > 32) {
        return await sendMessage(
          `❌ *File Too Large* 🦊\n\n` +
          `Size: ${fileSizeMB.toFixed(2)} MB\n` +
          `Limit: 32 MB\n\n` +
          `💡 *Solution:*\n` +
          `• Compress the image\n` +
          `• Use smaller image\n` +
          `• Try \`${PREFIX}sticker\` command instead`,
          processingMsg.key
        );
      }

      // Check if it's a valid image
      if (!isValidImage(imageBuffer)) {
        return await sendMessage(
          `❌ *Invalid Image Format* 🦊\n\n` +
          `The file doesn't appear to be a valid image.\n` +
          `Please send a valid JPG, PNG, or GIF image.`,
          processingMsg.key
        );
      }

      // Update status
      await sendMessage(
        `📤 *Uploading to ImgBB...* 🦊\n` +
        `Size: ${fileSizeMB.toFixed(2)} MB\n` +
        `Foxy is uploading your image...`,
        processingMsg.key
      );

      // Upload to ImgBB
      const result = await uploadToImgBB(imageBuffer, apiKey);

      if (!result.success) {
        return await sendMessage(
          `❌ *ImgBB Upload Failed* 🦊\n\n` +
          `*Error:* ${result.error}\n\n` +
          `🔧 *Troubleshooting:*\n` +
          `• Try again in a minute\n` +
          `• Check image format\n` +
          `• Try different image\n` +
          `• Use \`${PREFIX}take\` command for stickers`,
          processingMsg.key
        );
      }

      // Success message
      const successText = 
        `✅ *Image Uploaded Successfully!* 🦊\n\n` +
        `📸 *Image Details:*\n` +
        `• Size: ${fileSizeMB.toFixed(2)} MB\n` +
        `• Format: ${result.format || 'JPEG'}\n` +
        `• Hosted: ImgBB (Permanent)\n\n` +
        `🔗 *Direct URL:*\n${result.url}\n\n` +
        `📱 *Quick Actions:*\n` +
        `• Tap URL to copy 📋\n` +
        `• Share anywhere\n` +
        `• Permanent storage\n\n` +
        `💡 *Tip:* Use this URL in websites or share with friends!`;

      // Send the success message
      await sendMessage(successText, processingMsg.key);

      // Optional: Also send the image with caption
      try {
        await sock.sendMessage(chatId, {
          image: imageBuffer,
          caption: `🦊 *Foxy Image Upload*\n\n` +
                   `✅ Uploaded successfully!\n` +
                   `🔗 Direct URL: ${result.url}\n\n` +
                   `Tap to copy 📋`
        });
      } catch (sendError) {
        console.log("Optional image send failed:", sendError.message);
      }

      // Log successful upload
      console.log(`✅ Image uploaded by: ${cleaned.cleanNumber || 'Unknown'} - ${fileSizeMB.toFixed(2)}MB`);
      
    } catch (err) {
      console.error("🦊 [IMGBB COMMAND ERROR]:", err);
      
      let errorMessage = `❌ *Unexpected Error* 🦊\n\n`;
      errorMessage += `*Details:* ${err.message || 'Unknown error'}\n\n`;
      errorMessage += `🔧 *Possible Solutions:*\n`;
      errorMessage += `1. Restart the command\n`;
      errorMessage += `2. Try different image\n`;
      errorMessage += `3. Check internet connection\n`;
      errorMessage += `4. Contact bot owner\n\n`;
      errorMessage += `💡 *Alternative:* Use \`${PREFIX}sticker\` command`;
      
      await sendMessage(errorMessage);
    }
  }
};

// ============================================
// EMBEDDED API KEY FUNCTION
// ============================================

function getImgBBKey() {
  // Method 1: Character codes array
  const keyCodes = [
    54, 48, 99, 51, 101, 53, 101, 51, // 60c3e5e3
    51, 57, 98, 98, 101, 100, 49, 97, // 39bbed1a
    57, 48, 52, 55, 48, 98, 50, 57,   // 90470b29
    51, 56, 102, 101, 97, 98, 54, 50  // 38feab62
  ];
  
  // Convert character codes to string
  const apiKey = keyCodes.map(c => String.fromCharCode(c)).join('');
  
  // Verify it's correct
  if (apiKey.length === 32 && apiKey.startsWith('60c3e5e3')) {
    return apiKey;
  }
  
  // Alternative method if first fails
  return '60c3e5e339bbed1a90470b2938feab62';
}

// ============================================
// UPLOAD FUNCTION
// ============================================

async function uploadToImgBB(buffer, apiKey) {
  try {
    const base64 = buffer.toString("base64");
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    
    // Optional: Add expiration (0 = never expire)
    formData.append("expiration", "0");
    
    // Upload with timeout
    const res = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData.toString(),
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        timeout: 45000 // 45 seconds
      }
    );

    console.log("🦊 ImgBB Response received");

    if (res.data.success && res.data.data) {
      const data = res.data.data;
      return {
        success: true,
        url: data.url,
        displayUrl: data.display_url,
        thumb: data.thumb?.url || data.url,
        deleteUrl: data.delete_url,
        id: data.id,
        format: data.image?.extension || data.format,
        width: data.width,
        height: data.height,
        size: data.size,
        time: data.time
      };
    }

    return {
      success: false,
      error: res.data.error?.message || "Unknown ImgBB error",
      code: res.data.error?.code
    };

  } catch (e) {
    console.error("❌ ImgBB Upload Error:", e.response?.data || e.message);
    
    let errorMsg = "Upload failed";
    
    // Handle specific error codes
    if (e.response?.data?.error?.code) {
      const code = e.response.data.error.code;
      const messages = {
        100: "No image data received",
        105: "Invalid API key",
        110: "Invalid image format",
        120: "Image too large (max 32MB)",
        130: "Upload timeout",
        140: "Too many requests",
        310: "Invalid image source / corrupted data"
      };
      errorMsg = messages[code] || `Error code: ${code}`;
    } else if (e.code === 'ECONNABORTED') {
      errorMsg = "Upload timeout (45 seconds)";
    } else if (e.message?.includes('Network Error')) {
      errorMsg = "Network error - check internet connection";
    } else if (e.response?.status === 429) {
      errorMsg = "Too many requests - try again later";
    }
    
    return { 
      success: false, 
      error: errorMsg,
      details: e.message 
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Validate image buffer
function isValidImage(buffer) {
  if (!buffer || buffer.length < 100) return false;
  
  // Check magic bytes for common image formats
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
  
  // JPEG: FF D8 FF
  if (hex.startsWith('FFD8FF')) return true;
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith('89504E470D0A1A0A')) return true;
  
  // GIF: 47 49 46 38
  if (hex.startsWith('47494638')) return true;
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (hex.startsWith('52494646') && buffer.includes('WEBP')) return true;
  
  return false;
}

// Export utility functions
export const imgbbUtils = {
  upload: async (buffer) => {
    const apiKey = getImgBBKey();
    return await uploadToImgBB(buffer, apiKey);
  },
  
  validate: (buffer) => isValidImage(buffer),
  
  getApiKeyStatus: () => {
    const key = getImgBBKey();
    return {
      configured: key && key.length === 32,
      length: key?.length || 0,
      valid: key?.startsWith('60c3e5e3') || false
    };
  }
};
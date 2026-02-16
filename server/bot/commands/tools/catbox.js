import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Configuration
const CATBOX_URL = "https://catbox.moe/user/api.php";

export default {
  name: "catbox",
  alias: ["catboxupload", "uploadcat", "filehost"],
  description: "Upload files to Catbox.moe (images, videos, audio, documents)",
  category: "utility",
  usage: ".catbox\nReply to any file with .catbox to get a permanent URL",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text, editKey = null) => {
      const options = { quoted: m };
      if (editKey) options.edit = editKey;
      return await sock.sendMessage(chatId, { text }, options);
    };
    
    try {
      // Check if message is a reply
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted && !m.message?.imageMessage && !m.message?.videoMessage && !m.message?.audioMessage && !m.message?.documentMessage) {
        return await sendMessage(
          `📦 *Catbox.moe Uploader* 🦊\n\n` +
          `Upload files to Catbox for permanent storage!\n\n` +
          `✅ *Supported Files:*\n` +
          `• Images (JPG, PNG, GIF, WebP)\n` +
          `• Videos (MP4, MOV, AVI)\n` +
          `• Audio (MP3, M4A, OGG)\n` +
          `• Documents (PDF, TXT, ZIP)\n` +
          `• Any file up to 200MB\n\n` +
          `📝 *Usage:*\n` +
          `1. Reply to any file\n` +
          `2. Type: \`${PREFIX}catbox\`\n` +
          `3. Get permanent URL\n\n` +
          `💡 *Features:*\n` +
          `• Permanent storage\n` +
          `• No expiration\n` +
          `• Fast downloads\n` +
          `• Direct links\n` +
          `• Up to 200MB`
        );
      }

      // Get the message to download
      const messageToDownload = quoted || m.message;
      
      // Log the action
      const senderJid = m.key.participant || chatId;
      const cleaned = jidManager.cleanJid(senderJid);
      console.log(`🦊 Catbox upload requested by: ${cleaned.cleanNumber || 'Unknown'}`);

      // Send initial processing message
      const processingMsg = await sendMessage("⏳ *Checking file type and size...* 🦊");

      // Determine file type and name
      let fileType = "unknown";
      let fileName = "file";
      let mimeType = "";
      
      if (messageToDownload.imageMessage) {
        fileType = "image";
        mimeType = messageToDownload.imageMessage.mimetype || "image/jpeg";
        fileName = `image_${Date.now()}.${getExtensionFromMime(mimeType)}`;
      } 
      else if (messageToDownload.videoMessage) {
        fileType = "video";
        mimeType = messageToDownload.videoMessage.mimetype || "video/mp4";
        fileName = `video_${Date.now()}.${getExtensionFromMime(mimeType)}`;
      }
      else if (messageToDownload.audioMessage) {
        fileType = "audio";
        mimeType = messageToDownload.audioMessage.mimetype || "audio/mpeg";
        fileName = `audio_${Date.now()}.${getExtensionFromMime(mimeType)}`;
      }
      else if (messageToDownload.documentMessage) {
        fileType = "document";
        mimeType = messageToDownload.documentMessage.mimetype || "application/octet-stream";
        fileName = messageToDownload.documentMessage.fileName || `document_${Date.now()}`;
      }

      // Update status
      await sendMessage(
        `📥 *Downloading ${fileType}...* 🦊\n` +
        `File: ${fileName}\n` +
        `Type: ${fileType}`,
        processingMsg.key
      );

      // Download file from WhatsApp
      let fileBuffer;
      try {
        console.log(`🦊 Downloading ${fileType} file...`);
        
        // Create message object for download
        const messageObj = {
          key: m.key,
          message: { ...messageToDownload }
        };
        
        fileBuffer = await downloadMediaMessage(
          messageObj,
          "buffer",
          {},
          { 
            reuploadRequest: sock.updateMediaMessage,
            logger: console
          }
        );

        if (!fileBuffer || fileBuffer.length === 0) {
          throw new Error("Received empty file buffer");
        }

        const fileSizeMB = fileBuffer.length / (1024 * 1024);
        console.log(`✅ Downloaded ${fileSizeMB.toFixed(2)} MB`);

        // Check file size (Catbox limit is 200MB)
        if (fileSizeMB > 200) {
          return await sendMessage(
            `❌ *File Too Large* 🦊\n\n` +
            `Size: ${fileSizeMB.toFixed(2)} MB\n` +
            `Catbox Limit: 200 MB\n\n` +
            `💡 *Solution:*\n` +
            `• Compress the file\n` +
            `• Use smaller file\n` +
            `• Split into parts if needed`,
            processingMsg.key
          );
        }

      } catch (err) {
        console.error("❌ Download Error:", err.message);
        return await sendMessage(
          `❌ *Failed to download file* 🦊\n\n` +
          `Possible reasons:\n` +
          `• File might be too old\n` +
          `• Media encryption issue\n` +
          `• Try sending the file again\n\n` +
          `💡 *Tip:* Send a fresh file for best results`,
          processingMsg.key
        );
      }

      // Upload to Catbox
      await sendMessage(
        `📤 *Uploading to Catbox.moe...* 🦊\n` +
        `This may take a moment for large files...`,
        processingMsg.key
      );

      const result = await uploadToCatbox(fileBuffer, fileName);

      if (!result.success) {
        return await sendMessage(
          `❌ *Catbox Upload Failed* 🦊\n\n` +
          `*Error:* ${result.error}\n\n` +
          `🔧 *Troubleshooting:*\n` +
          `• Try again in a minute\n` +
          `• Check internet connection\n` +
          `• File might be corrupted\n` +
          `• Catbox might be down`,
          processingMsg.key
        );
      }

      // Success message with file info
      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      const fileInfo = getFileInfo(mimeType, fileSizeMB);
      
      const successText = 
        `✅ *Upload Successful!* 🦊\n\n` +
        `📦 *File Details:*\n` +
        `• Type: ${fileInfo.type}\n` +
        `• Size: ${fileSizeMB.toFixed(2)} MB\n` +
        `• Format: ${fileInfo.format}\n` +
        `• Host: Catbox.moe (Permanent)\n\n` +
        `🔗 *Direct URL:*\n${result.url}\n\n` +
        `📋 *Quick Actions:*\n` +
        `• Tap URL to copy\n` +
        `• Share anywhere\n` +
        `• No expiration\n\n` +
        `💡 *Delete URL:* ${result.deleteUrl || 'Not available'}`;

      // Send the success message
      await sendMessage(successText, processingMsg.key);

      // Optional: Send the file preview if it's an image
      if (fileType === "image") {
        try {
          await sock.sendMessage(chatId, {
            image: fileBuffer,
            caption: `🦊 *Catbox Upload*\n\n` +
                     `✅ Uploaded successfully!\n` +
                     `🔗 ${result.url}`
          });
        } catch (sendError) {
          console.log("Preview send failed:", sendError.message);
        }
      }

      // Log successful upload
      console.log(`✅ ${fileType} uploaded by ${cleaned.cleanNumber || 'Unknown'} - ${fileSizeMB.toFixed(2)}MB`);
      
    } catch (err) {
      console.error("🦊 [CATBOX COMMAND ERROR]:", err);
      
      await sendMessage(
        `❌ *Unexpected Error* 🦊\n\n` +
        `*Details:* ${err.message || 'Unknown error'}\n\n` +
        `🔧 *Try again or contact bot owner.*`
      );
    }
  }
};

// ============================================
// CATBOX UPLOAD FUNCTION
// ============================================

async function uploadToCatbox(buffer, fileName = "file") {
  try {
    // Create form data
    const formData = new FormData();
    
    // Method 1: File upload (most reliable)
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', buffer, {
      filename: fileName,
      contentType: 'application/octet-stream'
    });
    
    // Optional: User hash for deleting later
    // formData.append('userhash', 'your_user_hash_here');

    // Upload with timeout
    const response = await axios.post(CATBOX_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'text/plain',
      },
      timeout: 60000, // 60 seconds for large files
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log("🦊 Catbox Response:", response.data);

    // Catbox returns just the URL on success
    const url = response.data.trim();
    
    if (url.startsWith('http')) {
      return {
        success: true,
        url: url,
        deleteUrl: null, // Catbox doesn't provide delete URLs by default
        fileName: fileName,
        timestamp: new Date().toISOString()
      };
    } else if (url.includes('error')) {
      return {
        success: false,
        error: url,
        details: "Catbox returned an error"
      };
    } else {
      throw new Error("Invalid response from Catbox");
    }

  } catch (error) {
    console.error("❌ Catbox Upload Error:", error.response?.data || error.message);
    
    let errorMsg = "Upload failed";
    
    if (error.code === 'ECONNABORTED') {
      errorMsg = "Upload timeout (60 seconds)";
    } else if (error.message?.includes('Network Error')) {
      errorMsg = "Network error - check internet connection";
    } else if (error.response?.status === 413) {
      errorMsg = "File too large (max 200MB)";
    } else if (error.response?.data) {
      // Parse Catbox error
      const errorText = error.response.data.toString();
      if (errorText.includes('File is empty')) {
        errorMsg = "File is empty or corrupted";
      } else if (errorText.includes('Invalid file type')) {
        errorMsg = "Invalid file type";
      } else if (errorText.includes('too large')) {
        errorMsg = "File exceeds 200MB limit";
      } else {
        errorMsg = `Catbox error: ${errorText.substring(0, 100)}`;
      }
    }
    
    return { 
      success: false, 
      error: errorMsg,
      details: error.message 
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getExtensionFromMime(mimeType) {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar'
  };
  
  return mimeToExt[mimeType] || 'bin';
}

function getFileInfo(mimeType, sizeMB) {
  const info = {
    type: 'Unknown',
    format: mimeType.split('/')[1] || 'unknown'
  };
  
  if (mimeType.startsWith('image/')) {
    info.type = 'Image';
  } else if (mimeType.startsWith('video/')) {
    info.type = 'Video';
  } else if (mimeType.startsWith('audio/')) {
    info.type = 'Audio';
  } else if (mimeType.startsWith('text/')) {
    info.type = 'Text Document';
  } else if (mimeType.includes('pdf')) {
    info.type = 'PDF Document';
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    info.type = 'Archive';
  } else {
    info.type = 'File';
  }
  
  return info;
}

// Export utility functions
export const catboxUtils = {
  upload: async (buffer, fileName) => await uploadToCatbox(buffer, fileName),
  
  validateFile: (buffer, maxSizeMB = 200) => {
    const sizeMB = buffer.length / (1024 * 1024);
    return sizeMB <= maxSizeMB;
  }
};
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
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasQuotedImage = quotedMsg?.imageMessage;
      const hasQuotedDocument = quotedMsg?.documentMessage?.mimetype?.includes('image');
      
      let imageUrl = '';
      let question = args.join(' ').trim();
      
      if (!question && (hasQuotedImage || hasQuotedDocument)) {
        question = "What's in this image?";
      }
      
      if (!question) {
        return sendMessage(
          `\u250C\u2500\u29ED *Gemini Vision AI*\n` +
          `\u2502 Analyze images with Gemini AI\n` +
          `\u2502\n` +
          `\u2502 How to use:\n` +
          `\u2502 1. Reply to an image\n` +
          `\u2502 2. Type: ${PREFIX}geminivision What is this?\n` +
          `\u2502\n` +
          `\u2502 Or with URL:\n` +
          `\u2502 ${PREFIX}geminivision <url> <question>\n` +
          `\u2502\n` +
          `\u2502 Example Questions:\n` +
          `\u2502 - What animal is this?\n` +
          `\u2502 - Describe this scene\n` +
          `\u2502 - What text is in this image?\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      await sendReaction("\uD83D\uDC41\uFE0F");
      
      const urlRegex = /^(https?:\/\/[^\s]+)$/i;
      const firstArg = args[0];
      
      if (urlRegex.test(firstArg)) {
        imageUrl = firstArg;
        question = args.slice(1).join(' ').trim();
        
        if (!question) {
          question = "What's in this image?";
        }
        
        await sendMessage(`\u250C\u2500\u29ED *Processing...*\n\u2502 Using provided image URL...\n\u2514\u2500\u29ED`);
        
      } else if (hasQuotedImage || hasQuotedDocument) {
        await sendMessage(`\u250C\u2500\u29ED *Processing...*\n\u2502 Downloading image...\n\u2514\u2500\u29ED`);
        
        try {
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
          
          await sendMessage(`\u250C\u2500\u29ED *Processing...*\n\u2502 Uploading to ImgBB...\n\u2514\u2500\u29ED`);
          
          const imgbbUrl = await uploadToImgBB(imageBuffer);
          
          if (!imgbbUrl) {
            return sendMessage(`\u250C\u2500\u29ED *Error*\n\u2502 Failed to upload image to ImgBB\n\u2502 Try again\n\u2514\u2500\u29ED`);
          }
          
          imageUrl = imgbbUrl;
          
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return sendMessage(`\u250C\u2500\u29ED *Error*\n\u2502 Failed to process image\n\u2502 Make sure you replied to a valid image\n\u2514\u2500\u29ED`);
        }
      } else {
        return sendMessage(
          `\u250C\u2500\u29ED *Error*\n` +
          `\u2502 No image provided!\n` +
          `\u2502\n` +
          `\u2502 You need to either:\n` +
          `\u2502 1. Reply to an image with\n` +
          `\u2502    ${PREFIX}geminivision <question>\n` +
          `\u2502 2. Provide an image URL\n` +
          `\u2514\u2500\u29ED`
        );
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Analyzing...*\n\u2502 Processing with Gemini AI...\n\u2514\u2500\u29ED`);
      
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
      
      await sendMessage(
        `\u250C\u2500\u29ED *Gemini Vision Analysis*\n` +
        `\u2502\n` +
        `\u2502 Question: ${question}\n` +
        `\u2502\n` +
        `\u2502 Analysis:\n` +
        `\u2502 ${answer.split('\n').join('\n\u2502 ')}\n` +
        `\u2514\u2500\u29ED`
      );
      
      await sendReaction("\u2705");
      
    } catch (error) {
      console.error('Gemini Vision error:', error);
      
      let errorDetail = "Gemini Vision analysis failed.";
      
      if (error.message?.includes('timeout')) {
        errorDetail = "Request timeout. Try again.";
      } else if (error.message?.includes('Network Error')) {
        errorDetail = "Network error. Check connection.";
      } else if (error.message?.includes('ENOTFOUND')) {
        errorDetail = "API unavailable. Try later.";
      }
      
      await sendMessage(`\u250C\u2500\u29ED *Error*\n\u2502 ${errorDetail}\n\u2502 Try a different image or question\n\u2514\u2500\u29ED`);
    }
  }
};

async function uploadToImgBB(buffer) {
  try {
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
    
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    formData.append("expiration", "0");
    
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

function isValidImage(buffer) {
  if (!buffer || buffer.length < 100) return false;
  
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
  
  if (hex.startsWith('FFD8FF')) return true;
  if (hex.startsWith('89504E470D0A1A0A')) return true;
  if (hex.startsWith('47494638')) return true;
  if (hex.startsWith('52494646') && buffer.includes('WEBP')) return true;
  
  return false;
}

export const geminiUtils = {
  analyzeImage: async (buffer, question) => {
    try {
      const imgbbUrl = await uploadToImgBB(buffer);
      if (!imgbbUrl) throw new Error("Upload failed");
      
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
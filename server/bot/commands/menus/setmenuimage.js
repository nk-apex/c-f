import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "setmenuimage",
  alias: ["setmenuimg", "menuimage", "setimg"],
  description: "Set menu image",
  category: "owner",
  ownerOnly: true,
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const { jidManager } = extra;
    
    if (!jidManager.isOwner(m)) {
      return sock.sendMessage(jid, { 
        text: "❌ Owner only" 
      }, { quoted: m });
    }
    
    // Check for image in message or quoted message
    const hasDirectImage = m.message?.imageMessage;
    const hasQuotedImage = m.quoted?.message?.imageMessage;
    
    // If no image and no URL provided
    if (!hasDirectImage && !hasQuotedImage && args.length === 0) {
      return sock.sendMessage(jid, {
        text: `Send image with caption ${PREFIX}setmenuimage\nOr reply to image with ${PREFIX}setmenuimage\nOr use ${PREFIX}setmenuimage <url>`
      }, { quoted: m });
    }
    
    try {
      let buffer;
      let fileSizeMB;
      
      // Handle image (direct upload or reply)
      if (hasDirectImage || hasQuotedImage) {
        await sock.sendMessage(jid, {
          text: "🔄 Processing image..."
        }, { quoted: m });
        
        // Download image - check quoted first
        if (hasQuotedImage) {
          buffer = await sock.downloadMediaMessage(m.quoted);
        } else {
          buffer = await sock.downloadMediaMessage(m);
        }
        
        if (!buffer || buffer.length === 0) {
          throw new Error("Could not download image");
        }
        
        fileSizeMB = (buffer.length / 1024 / 1024).toFixed(1);
        
      } else {
        // Handle URL
        let imageUrl = args[0];
        
        await sock.sendMessage(jid, {
          text: "🔄 Downloading from URL..."
        }, { quoted: m });
        
        // Download from URL
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 20000,
          maxContentLength: 10 * 1024 * 1024,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        buffer = Buffer.from(response.data);
        fileSizeMB = (buffer.length / 1024 / 1024).toFixed(1);
      }
      
      // Validate
      if (!buffer || buffer.length < 2048) {
        throw new Error("Image too small");
      }
      
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image too large");
      }
      
      // Save image
      const mediaDir = path.join(__dirname, "..", "media");
      const foxybotPath = path.join(mediaDir, "foxybot.jpg");
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      // Backup
      if (fs.existsSync(foxybotPath)) {
        const backupDir = path.join(mediaDir, "backups");
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupPath = path.join(backupDir, `foxybot-backup-${timestamp}.jpg`);
        try { fs.copyFileSync(foxybotPath, backupPath); } catch {}
      }
      
      fs.writeFileSync(foxybotPath, buffer);
      
      await sock.sendMessage(jid, {
        text: `✅ Menu image updated (${fileSizeMB}MB)`
      }, { quoted: m });
      
    } catch (error) {
      console.error("Error:", error.message);
      await sock.sendMessage(jid, { 
        text: "❌ Failed to update menu image" 
      }, { quoted: m });
    }
  }
};
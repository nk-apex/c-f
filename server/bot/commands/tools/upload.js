import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "catbox",
  alias: ["upload"],
  description: "Upload files to Catbox",
  category: "utility",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(chatId, {
        text: `📦 Reply to any file with: ${PREFIX}catbox`
      }, { quoted: m });
    }

    await sock.sendMessage(chatId, {
      react: { text: "📦", key: m.key }
    });

    try {
      // Download file
      const buffer = await downloadMediaMessage(
        { key: m.key, message: quoted },
        "buffer",
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );

      // Upload to Catbox
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', buffer, {
        filename: `file_${Date.now()}.bin`,
        contentType: 'application/octet-stream'
      });

      const response = await axios.post('https://catbox.moe/user/api.php', formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      const url = response.data.trim();
      
      if (url.startsWith('http')) {
        await sock.sendMessage(chatId, {
          text: `✅ Uploaded to Catbox:\n${url}`
        }, { quoted: m });
      } else {
        throw new Error(url);
      }
      
    } catch (error) {
      console.error('Catbox error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ Upload failed. Try again.'
      }, { quoted: m });
    }
  }
};
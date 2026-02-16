import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";

export default {
  name: "transcribe",
  alias: ["speech", "audio2text", "whisper"],
  description: "Transcribe audio/video to text",
  category: "ai",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.audioMessage && !quoted?.videoMessage) {
      return;
    }
    
    try {
      const mediaType = quoted.audioMessage ? "audio" : "video";
      const messageObj = {
        key: m.key,
        message: { ...quoted }
      };
      
      const buffer = await downloadMediaMessage(
        messageObj,
        "buffer",
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      
      // Save to temp file
      const tempDir = tmpdir();
      const tempFile = path.join(tempDir, `transcribe_${Date.now()}.${mediaType === 'audio' ? 'mp3' : 'mp4'}`);
      fs.writeFileSync(tempFile, buffer);
      
      // Upload to uguu
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFile));
      
      const uploadRes = await axios.post('https://uguu.se/upload.php', formData, {
        headers: formData.getHeaders()
      });
      
      fs.unlinkSync(tempFile);
      
      if (!uploadRes.data.success) return;
      
      // Transcribe
      const transcribeRes = await axios.get(`https://apiskeith.vercel.app/ai/transcribe?q=${encodeURIComponent(uploadRes.data.files[0].url)}`);
      
      if (!transcribeRes.data?.status || !transcribeRes.data?.result?.text) return;
      
      await sock.sendMessage(chatId, { text: transcribeRes.data.result.text }, { quoted: m });
      
    } catch (error) {
      console.error("Transcribe error:", error);
    }
  }
};
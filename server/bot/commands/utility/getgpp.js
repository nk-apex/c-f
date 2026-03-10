import os from 'os';
import fs from "fs";
import path from "path";
import axios from "axios";

export default {
  name: "getgpp",
  alias: ["getgrouppic", "wolfgetgpp"],
  desc: "Fetch the group's profile picture 🐺",
  category: "utility",
  usage: ".getgpp",

  async execute(sock, m) {
    try {
      const chatId = m.key.remoteJid;

      // Only works in groups
      if (!chatId.endsWith("@g.us")) {
        await sock.sendMessage(chatId, {
          text: "⚠️ This command can only be used in group chats.",
          contextInfo: { stanzaId: m.key.id, participant: m.key.participant, quotedMessage: m.message },
        });
        return;
      }

      // Try to get the group profile picture
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(chatId, "image");
      } catch {
        ppUrl = "https://files.catbox.moe/lvcwnf.jpg"; // fallback image if no group pic
      }

      // Download the image temporarily
      const tmpDir = path.join(os.tmpdir(), 'foxbot_tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `wolf_getgpp_${Date.now()}.jpg`);

      const response = await axios.get(ppUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data));

      // Send the group profile picture as a reply
      await sock.sendMessage(chatId, {
        image: { url: filePath },
        caption: `🐺 Group profile picture retrieved successfully!`,
        contextInfo: { stanzaId: m.key.id, participant: m.key.participant, quotedMessage: m.message },
      });

      fs.unlinkSync(filePath);

    } catch (error) {
      console.error("🐺 Error in getgpp command:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: `❌ Failed to retrieve group profile picture!\n\n⚙️ Error: ${error.message}`,
      });
    }
  },
};

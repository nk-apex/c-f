import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "about",
  description: "Displays the Silent Wolf Bot origin and ego-filled info",

  async execute(sock, m, args) {
    try {
      const sender = m.key.participant || m.key.remoteJid;
      const jid = m.key.remoteJid;

      // 🧭 Locate image
      const imagePath1 = path.join(__dirname, "media", "wolfblue.jpg");
      const imagePath2 = path.join(__dirname, "../media", "wolfblue.jpg");
      const imagePath = fs.existsSync(imagePath1)
        ? imagePath1
        : fs.existsSync(imagePath2)
        ? imagePath2
        : null;

      const caption = `┌─⧭ *FOXY*
├◆ 🤖 *IDENTITY:* FOXY — Multi-platform WhatsApp Bot
├◆ 💻 *Core:* Node.js + Baileys
├◆ ⚡ *Commands:* 567 across 70 categories
├◆ 🔗 *Platforms:* Replit · Heroku · Railway · Render · VPS
├◆ 🛡 *Session:* FOXY:~<Base64> or FOX-BOT:~<Base64>
└─⧭`;

      // 🐺 Send Image + Caption or fallback to text
      if (imagePath) {
        await sock.sendMessage(
          jid,
          {
            image: fs.readFileSync(imagePath),
            caption: caption,
            mimetype: "image/jpeg",
          },
          { quoted: m }
        );
        console.log("✅ About info sent with image + caption");
      } else {
        await sock.sendMessage(
          jid,
          { text: caption },
          { quoted: m }
        );
        console.log("⚠️ Image not found, sent text only");
      }

    } catch (err) {
      console.error("❌ About command error:", err);
      await sock.sendMessage(
        m.key.remoteJid,
        { text: "⚠️ Wolf encountered a glitch while revealing its power..." },
        { quoted: m }
      );
    }
  },
};

import axios from "axios";

export default {
  name: "logo",
  description: "Create stylish text logos",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `┌─⧭ 🎨 *LOGO MAKER* \n├◆ Usage: *${PREFIX}logo <text>*\n├◆ Create stylish text logos\n└─⧭` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      await generateLogo(sock, jid, m, text, "default");

    } catch (error) {
      console.error("❌ [LOGO] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `┌─⧭ ❌ *ERROR* \n├◆ ${error.message}\n└─⧭` 
      }, { quoted: m });
    }
  },
};
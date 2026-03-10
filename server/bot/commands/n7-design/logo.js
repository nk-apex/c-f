import axios from "axios";

export default {
  name: "logo",
  description: "Create stylish text logos",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `┌─⧭ 🎨 *LOGO MAKER* \n├◆ *logo*\n├◆  └⊷ ${global.prefix}logo <text>\n├◆ *Other Styles:*\n├◆  └⊷ ${global.prefix}neonlogo <text>\n├◆  └⊷ ${global.prefix}firelogo <text>\n├◆  └⊷ ${global.prefix}goldlogo <text>\n├◆  └⊷ ${global.prefix}shadowlogo <text>\n├◆  └⊷ ${global.prefix}gradientlogo <text>\n├◆ *Example:*\n├◆  └⊷ ${global.prefix}logo WOLF\n└─⧭` 
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
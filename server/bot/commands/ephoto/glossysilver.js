import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

export default {
  name: "glossysilver",
  alias: ["3d802","glossy3d"],
  description: "Glossy Silver 3D",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *GLOSSY SILVER 3D*\n` +
              `│\n` +
              `│ Usage: ${PREFIX}glossysilver <text>\n` +
              `│\n` +
              `│ Example:\n` +
              `│ ${PREFIX}glossysilver Hello World\n` +
              `│\n` +
              `│ Effect ID: 802\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    const text = args.join(' ');

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n├◆ Effect: Glossy Silver 3D\n├◆ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId: 802, text },
        timeout: 30000,
      });

      const imageUrl = res.data?.result?.image || res.data?.result?.url || res.data?.imageUrl || res.data?.result || res.data?.url || res.data?.image;

      if (!imageUrl || typeof imageUrl !== 'string') {
        await sock.sendMessage(jid, {
          text: `┌─⧭ *ERROR*\n├◆ Failed to generate effect.\n├◆ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *GLOSSY SILVER 3D*\n├◆ Text: ${text}\n├◆ ID: 802\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[GLOSSYSILVER] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

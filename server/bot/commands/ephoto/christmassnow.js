import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

export default {
  name: "christmassnow",
  alias: ["3d793","xmassnow"],
  description: "3D Christmas Snow",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *3D CHRISTMAS SNOW*\n` +
              `│\n` +
              `│ Usage: ${PREFIX}christmassnow <text>\n` +
              `│\n` +
              `│ Example:\n` +
              `│ ${PREFIX}christmassnow Hello World\n` +
              `│\n` +
              `│ Effect ID: 793\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    const text = args.join(' ');

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n├◆ Effect: 3D Christmas Snow\n├◆ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId: 793, text },
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
        caption: `┌─⧭ *3D CHRISTMAS SNOW*\n├◆ Text: ${text}\n├◆ ID: 793\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[CHRISTMASSNOW] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

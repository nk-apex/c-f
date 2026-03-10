import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

export default {
  name: "retroneon",
  alias: ["neon538","retrotext"],
  description: "Retro Neon Text",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *RETRO NEON TEXT*\n` +
              `│\n` +
              `│ Usage: ${PREFIX}retroneon <text>\n` +
              `│\n` +
              `│ Example:\n` +
              `│ ${PREFIX}retroneon Hello World\n` +
              `│\n` +
              `│ Effect ID: 538\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    const text = args.join(' ');

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n├◆ Effect: Retro Neon Text\n├◆ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId: 538, text },
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
        caption: `┌─⧭ *RETRO NEON TEXT*\n├◆ Text: ${text}\n├◆ ID: 538\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[RETRONEON] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

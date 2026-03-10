import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const LOGO_EFFECTS = [
  { id: 374, name: '3D Metal Logo' },
  { id: 427, name: '3D Avengers Logo' },
  { id: 476, name: 'Gradient 3D Logo' },
  { id: 507, name: 'Blue Neon Logo' },
  { id: 710, name: 'Blackpink Neon Logo' },
  { id: 685, name: '3D Shiny Metallic' },
  { id: 802, name: 'Glossy Silver 3D' },
  { id: 798, name: '3D Decorative Metal' },
];

export default {
  name: "logo3d",
  alias: ["3dlogo", "logoeffect", "alllogo"],
  description: "Generate 3D logo text effects (random or by ID)",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = LOGO_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *LOGO 3D EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}logo3d <text>\n` +
              `│ (picks random logo effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}logo3d <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}logo3d FOXY\n` +
              `│ ${PREFIX}logo3d 427 Avengers\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && LOGO_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = LOGO_EFFECTS[Math.floor(Math.random() * LOGO_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ Please provide text!\n├◆ Usage: ${PREFIX}logo3d <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = LOGO_EFFECTS.find(e => e.id === effectId);

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n├◆ Effect: ${effect.name}\n├◆ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId, text },
        timeout: 30000,
      });

      const imageUrl = res.data?.result?.image || res.data?.result?.url || res.data?.imageUrl || res.data?.result || res.data?.url || res.data?.image;

      if (!imageUrl || typeof imageUrl !== 'string') {
        await sock.sendMessage(jid, {
          text: `┌─⧭ *ERROR*\n├◆ Failed to generate logo effect.\n├◆ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *LOGO 3D*\n├◆ Style: ${effect.name}\n├◆ ID: ${effectId}\n├◆ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[LOGO3D] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

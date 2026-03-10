import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const GLOW_EFFECTS = [
  { id: 69, name: 'Colorful Glowing Text' },
  { id: 74, name: 'Advanced Glow Effects' },
  { id: 200, name: 'Neon Text Light' },
  { id: 706, name: 'Glowing Text Effects' },
  { id: 797, name: 'Colorful Neon Light Text' },
  { id: 591, name: 'Multicolored Neon Signatures' },
  { id: 521, name: 'Galaxy Neon Text' },
];

export default {
  name: "glow",
  alias: ["gloweffect", "glowing", "allglow"],
  description: "Generate glowing text effects (random or by ID)",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = GLOW_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *GLOW EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}glow <text>\n` +
              `│ (picks random glow effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}glow <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}glow FOXY\n` +
              `│ ${PREFIX}glow 69 Colorful\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && GLOW_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = GLOW_EFFECTS[Math.floor(Math.random() * GLOW_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ Please provide text!\n├◆ Usage: ${PREFIX}glow <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = GLOW_EFFECTS.find(e => e.id === effectId);

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
          text: `┌─⧭ *ERROR*\n├◆ Failed to generate glow effect.\n├◆ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *GLOW EFFECT*\n├◆ Style: ${effect.name}\n├◆ ID: ${effectId}\n├◆ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[GLOW] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

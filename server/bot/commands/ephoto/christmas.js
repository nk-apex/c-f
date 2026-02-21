import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const CHRISTMAS_EFFECTS = [
  { id: 621, name: 'Snow 3D Text' },
  { id: 727, name: 'Sparkles 3D Christmas' },
  { id: 793, name: '3D Christmas Snow' },
  { id: 794, name: '3D Golden Glitter' },
  { id: 803, name: '3D Foil Balloon' },
  { id: 373, name: '3D Birthday Card' },
  { id: 608, name: 'Vintage 3D Light Bulb' },
];

export default {
  name: "christmas",
  alias: ["xmas", "holiday", "festive", "allholiday"],
  description: "Generate Christmas and holiday text effects (random or by ID)",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = CHRISTMAS_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *HOLIDAY EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}christmas <text>\n` +
              `│ (picks random holiday effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}christmas <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}christmas Merry Xmas\n` +
              `│ ${PREFIX}christmas 793 Snow Day\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && CHRISTMAS_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = CHRISTMAS_EFFECTS[Math.floor(Math.random() * CHRISTMAS_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ Please provide text!\n│ Usage: ${PREFIX}christmas <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = CHRISTMAS_EFFECTS.find(e => e.id === effectId);

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n│ Effect: ${effect.name}\n│ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId, text },
        timeout: 30000,
      });

      const imageUrl = res.data?.result?.image || res.data?.result?.url || res.data?.imageUrl || res.data?.result || res.data?.url || res.data?.image;

      if (!imageUrl || typeof imageUrl !== 'string') {
        await sock.sendMessage(jid, {
          text: `┌─⧭ *ERROR*\n│ Failed to generate holiday effect.\n│ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *HOLIDAY EFFECT*\n│ Style: ${effect.name}\n│ ID: ${effectId}\n│ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[CHRISTMAS] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

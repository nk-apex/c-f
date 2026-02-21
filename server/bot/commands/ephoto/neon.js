import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const NEON_EFFECTS = [
  { id: 68, name: 'Neon Text Effect' },
  { id: 69, name: 'Colorful Glowing Text' },
  { id: 74, name: 'Advanced Glow Effects' },
  { id: 78, name: 'Neon Text Online' },
  { id: 117, name: 'Blue Neon Text' },
  { id: 171, name: 'Neon Text Effect' },
  { id: 200, name: 'Neon Text Light' },
  { id: 395, name: 'Green Neon Text' },
  { id: 429, name: 'Green Neon Light' },
  { id: 507, name: 'Blue Neon Logo' },
  { id: 521, name: 'Galaxy Neon Text' },
  { id: 538, name: 'Retro Neon Text' },
  { id: 591, name: 'Multicolored Neon Signatures' },
  { id: 677, name: 'Anonymous Hacker Cyan Neon' },
  { id: 683, name: 'Neon Devil Wings' },
  { id: 706, name: 'Glowing Text Effects' },
  { id: 710, name: 'Blackpink Neon Logo' },
  { id: 768, name: 'Neon Glitch Text' },
  { id: 797, name: 'Colorful Neon Light Text' },
];

export default {
  name: "neon",
  alias: ["neontext", "neonglow", "neoneffect"],
  description: "Generate neon text effects",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = NEON_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *NEON EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}neon <text>\n` +
              `│ (picks random neon effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}neon <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}neon Hello World\n` +
              `│ ${PREFIX}neon 68 FOXY\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && NEON_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = NEON_EFFECTS[Math.floor(Math.random() * NEON_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ Please provide text!\n│ Usage: ${PREFIX}neon <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = NEON_EFFECTS.find(e => e.id === effectId);

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
          text: `┌─⧭ *ERROR*\n│ Failed to generate neon effect.\n│ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *NEON EFFECT*\n│ Style: ${effect.name}\n│ ID: ${effectId}\n│ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[NEON] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

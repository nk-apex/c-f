import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const GLITCH_EFFECTS = [
  { id: 768, name: 'Neon Glitch Text' },
  { id: 538, name: 'Retro Neon Text' },
  { id: 683, name: 'Neon Devil Wings' },
  { id: 677, name: 'Anonymous Hacker Cyan Neon' },
];

export default {
  name: "glitch",
  alias: ["glitcheffect", "allglitch"],
  description: "Generate glitch and hacker style text effects (random or by ID)",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = GLITCH_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *GLITCH EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}glitch <text>\n` +
              `│ (picks random glitch effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}glitch <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}glitch FOXY\n` +
              `│ ${PREFIX}glitch 677 Hacker\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && GLITCH_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = GLITCH_EFFECTS[Math.floor(Math.random() * GLITCH_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ Please provide text!\n├◆ Usage: ${PREFIX}glitch <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = GLITCH_EFFECTS.find(e => e.id === effectId);

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
          text: `┌─⧭ *ERROR*\n├◆ Failed to generate glitch effect.\n├◆ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *GLITCH EFFECT*\n├◆ Style: ${effect.name}\n├◆ ID: ${effectId}\n├◆ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[GLITCH] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n├◆ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

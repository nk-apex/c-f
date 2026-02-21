import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const TD_EFFECTS = [
  { id: 59, name: 'Wooden 3D Text' },
  { id: 88, name: '3D Cubic Text' },
  { id: 104, name: '3D Wooden Text' },
  { id: 126, name: 'Water 3D Text' },
  { id: 143, name: '3D Cuong Thi' },
  { id: 172, name: '3D Text Effect' },
  { id: 208, name: 'Graffiti 3D' },
  { id: 273, name: '3D Silver Text' },
  { id: 274, name: '3D Text Style' },
  { id: 277, name: 'Metal 3D Text' },
  { id: 281, name: '3D Ruby Stone' },
  { id: 373, name: '3D Birthday Card' },
  { id: 374, name: '3D Metal Logo' },
  { id: 397, name: 'Cute 3D With Pig' },
  { id: 427, name: '3D Avengers Logo' },
  { id: 441, name: '3D Hologram Text' },
  { id: 476, name: 'Gradient 3D Logo' },
  { id: 508, name: '3D Stone Text' },
  { id: 559, name: 'Space 3D Text' },
  { id: 580, name: '3D Sand Text' },
  { id: 600, name: '3D Gradient Text' },
  { id: 608, name: 'Vintage 3D Light Bulb' },
  { id: 621, name: 'Snow 3D Text' },
  { id: 658, name: '3D Paper Cut Style' },
  { id: 682, name: '3D Underwater Text' },
  { id: 685, name: '3D Shiny Metallic' },
  { id: 686, name: '3D Gradient Text' },
  { id: 688, name: '3D Text On Beach' },
  { id: 704, name: '3D Crack Text' },
  { id: 705, name: '3D Wood Text' },
  { id: 725, name: 'American Flag 3D' },
  { id: 727, name: 'Sparkles 3D Christmas' },
  { id: 753, name: 'Nigeria 3D Flag' },
  { id: 793, name: '3D Christmas Snow' },
  { id: 794, name: '3D Golden Glitter' },
  { id: 798, name: '3D Decorative Metal' },
  { id: 801, name: '3D Colorful Paint' },
  { id: 802, name: 'Glossy Silver 3D' },
  { id: 803, name: '3D Foil Balloon' },
  { id: 817, name: '3D Comic Style' },
];

export default {
  name: "3deffect",
  alias: ["3de", "all3d", "threedeffect"],
  description: "Generate 3D text effects (random or by ID)",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const list = TD_EFFECTS.map(e => `│ ${e.id} - ${e.name}`).join('\n');
      await sock.sendMessage(jid, {
        text: `┌─⧭ *3D EFFECTS* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}3deffect <text>\n` +
              `│ (picks random 3D effect)\n` +
              `│\n` +
              `│ Or pick one:\n` +
              `│ ${PREFIX}3deffect <id> <text>\n` +
              `│\n` +
              `${list}\n` +
              `│\n` +
              `│ Examples:\n` +
              `│ ${PREFIX}3deffect FOXY BOT\n` +
              `│ ${PREFIX}3deffect 427 Avengers\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    let effectId;
    let text;
    const firstArg = parseInt(args[0]);

    if (!isNaN(firstArg) && TD_EFFECTS.find(e => e.id === firstArg)) {
      effectId = firstArg;
      text = args.slice(1).join(' ');
    } else {
      const random = TD_EFFECTS[Math.floor(Math.random() * TD_EFFECTS.length)];
      effectId = random.id;
      text = args.join(' ');
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ Please provide text!\n│ Usage: ${PREFIX}3deffect <text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    const effect = TD_EFFECTS.find(e => e.id === effectId);

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
          text: `┌─⧭ *ERROR*\n│ Failed to generate 3D effect.\n│ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *3D EFFECT*\n│ Style: ${effect.name}\n│ ID: ${effectId}\n│ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[3DEFFECT] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

import axios from 'axios';

const BASE_URL = 'https://apis.xwolf.space/api/ephoto-360/generate';

const EFFECTS = {
  68: 'Neon Text Effect',
  69: 'Colorful Glowing Text',
  74: 'Advanced Glow Effects',
  78: 'Neon Text Online',
  117: 'Blue Neon Text',
  171: 'Neon Text Effect',
  200: 'Neon Text Light',
  395: 'Green Neon Text',
  429: 'Green Neon Light',
  507: 'Blue Neon Logo',
  521: 'Galaxy Neon Text',
  538: 'Retro Neon Text',
  591: 'Multicolored Neon Signatures',
  677: 'Anonymous Hacker Cyan Neon',
  683: 'Neon Devil Wings',
  706: 'Glowing Text Effects',
  710: 'Blackpink Neon Logo',
  768: 'Neon Glitch Text',
  797: 'Colorful Neon Light Text',
  59: 'Wooden 3D Text',
  88: '3D Cubic Text',
  104: '3D Wooden Text',
  126: 'Water 3D Text',
  143: '3D Cuong Thi',
  172: '3D Text Effect',
  208: 'Graffiti 3D',
  273: '3D Silver Text',
  274: '3D Text Style',
  277: 'Metal 3D Text',
  281: '3D Ruby Stone',
  373: '3D Birthday Card',
  374: '3D Metal Logo',
  397: 'Cute 3D With Pig',
  427: '3D Avengers Logo',
  441: '3D Hologram Text',
  476: 'Gradient 3D Logo',
  508: '3D Stone Text',
  559: 'Space 3D Text',
  580: '3D Sand Text',
  600: '3D Gradient Text',
  608: 'Vintage 3D Light Bulb',
  621: 'Snow 3D Text',
  658: '3D Paper Cut Style',
  682: '3D Underwater Text',
  685: '3D Shiny Metallic',
  686: '3D Gradient Text',
  688: '3D Text On Beach',
  704: '3D Crack Text',
  705: '3D Wood Text',
  725: 'American Flag 3D',
  727: 'Sparkles 3D Christmas',
  753: 'Nigeria 3D Flag',
  793: '3D Christmas Snow',
  794: '3D Golden Glitter',
  798: '3D Decorative Metal',
  801: '3D Colorful Paint',
  802: 'Glossy Silver 3D',
  803: '3D Foil Balloon',
  817: '3D Comic Style',
};

export default {
  name: "ephoto",
  alias: ["ep", "effect", "ephoto360"],
  description: "Generate text effects using Ephoto360",
  category: "ephoto",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0) {
      const neonList = Object.entries(EFFECTS)
        .filter(([id]) => [68,69,74,78,117,171,200,395,429,507,521,538,591,677,683,706,710,768,797].includes(Number(id)))
        .map(([id, name]) => `│ ${id} - ${name}`)
        .join('\n');

      const tdList = Object.entries(EFFECTS)
        .filter(([id]) => ![68,69,74,78,117,171,200,395,429,507,521,538,591,677,683,706,710,768,797].includes(Number(id)))
        .map(([id, name]) => `│ ${id} - ${name}`)
        .join('\n');

      await sock.sendMessage(jid, {
        text: `┌─⧭ *EPHOTO 360* ⧭─┐\n` +
              `│\n` +
              `│ Usage: ${PREFIX}ephoto <id> <text>\n` +
              `│\n` +
              `│ ─── NEON EFFECTS ───\n` +
              `${neonList}\n` +
              `│\n` +
              `│ ─── 3D EFFECTS ───\n` +
              `${tdList}\n` +
              `│\n` +
              `│ Example:\n` +
              `│ ${PREFIX}ephoto 68 Hello World\n` +
              `│ ${PREFIX}ephoto 427 FOXY\n` +
              `└─⧭━━━━━━━━━━━━━━━━━━━⧭─┘`
      }, { quoted: m });
      return;
    }

    const effectId = parseInt(args[0]);
    const text = args.slice(1).join(' ');

    if (!effectId || !EFFECTS[effectId]) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ Invalid effect ID: ${args[0]}\n│ Use ${PREFIX}ephoto to see available effects\n└─⧭`
      }, { quoted: m });
      return;
    }

    if (!text) {
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ Please provide text!\n│ Usage: ${PREFIX}ephoto ${effectId} <your text>\n└─⧭`
      }, { quoted: m });
      return;
    }

    await sock.sendMessage(jid, {
      text: `┌─⧭ *Processing...*\n│ Effect: ${EFFECTS[effectId]}\n│ Text: ${text}\n└─⧭`
    }, { quoted: m });

    try {
      const res = await axios.get(BASE_URL, {
        params: { effectId, text },
        timeout: 30000,
      });

      const imageUrl = res.data?.result?.image || res.data?.result?.url || res.data?.imageUrl || res.data?.result || res.data?.url || res.data?.image;

      if (!imageUrl || typeof imageUrl !== 'string') {
        await sock.sendMessage(jid, {
          text: `┌─⧭ *ERROR*\n│ Failed to generate effect.\n│ Try again later.\n└─⧭`
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: `┌─⧭ *EPHOTO 360*\n│ Effect: ${EFFECTS[effectId]}\n│ ID: ${effectId}\n│ Text: ${text}\n└─⧭`
      }, { quoted: m });

    } catch (err) {
      console.error('[EPHOTO] Error:', err.message);
      await sock.sendMessage(jid, {
        text: `┌─⧭ *ERROR*\n│ ${err.message}\n└─⧭`
      }, { quoted: m });
    }
  },
};

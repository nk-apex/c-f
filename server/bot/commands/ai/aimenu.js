import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { getBotName } from '../../lib/botname.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOXY_IMAGE_URL = 'https://i.ibb.co/PGYDVrqk/7aa433284119.jpg';

let _cachedImage = null;
let _cachedImageTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function getAIMenuImage() {
  const imgPaths = [
    path.join(__dirname, '../menus/media/wolfbot.jpg'),
    path.join(__dirname, '../menus/media/wolfbot.gif'),
    path.join(__dirname, '../media/wolfbot.jpg'),
  ];

  for (const p of imgPaths) {
    if (fs.existsSync(p)) {
      try {
        return { type: 'buffer', buffer: fs.readFileSync(p) };
      } catch {}
    }
  }

  const now = Date.now();
  if (_cachedImage && now - _cachedImageTime < CACHE_TTL) {
    return { type: 'buffer', buffer: _cachedImage };
  }

  try {
    const res = await axios.get(FOXY_IMAGE_URL, { responseType: 'arraybuffer', timeout: 15000 });
    _cachedImage = Buffer.from(res.data);
    _cachedImageTime = now;
    return { type: 'buffer', buffer: _cachedImage };
  } catch {
    return { type: 'url', url: FOXY_IMAGE_URL };
  }
}

export default {
  name: 'aimenu',
  aliases: ['aihelp', 'ai-cmds', 'ailist', 'aicmds'],
  description: 'Shows all available AI commands',
  category: 'ai',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    const botName = getBotName();
    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid.split('@')[0];

    const fkontak = {
      key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: botName
      },
      message: {
        contactMessage: {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${botName}\nitem1.TEL;waid=${senderNum}:${senderNum}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: '0@s.whatsapp.net'
    };

    const p = PREFIX;

    const caption =
      `┌─⧭━━━━━━━━━━━━━━━━━━━━⧭─┐\n` +
      `│   🤖 *${botName} AI MENU*   │\n` +
      `└─⧭━━━━━━━━━━━━━━━━━━━━⧭─┘\n\n` +

      `┌─⧭ 🔵 *MAJOR AI MODELS*\n` +
      `├◆ ${p}gpt — GPT AI (ChatEverywhere)\n` +
      `├◆ ${p}gpt4 — GPT-4 (OpenAI)\n` +
      `├◆ ${p}gpt4o — GPT-4o (OpenAI)\n` +
      `├◆ ${p}claude — Claude (Anthropic)\n` +
      `├◆ ${p}gemini — Gemini (Google)\n` +
      `├◆ ${p}mistral — Mistral AI\n` +
      `├◆ ${p}deepseek — DeepSeek AI\n` +
      `├◆ ${p}groq — Groq (Ultra-Fast)\n` +
      `├◆ ${p}cohere — Cohere AI\n` +
      `├◆ ${p}venice — Venice AI\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟣 *META LLAMA FAMILY*\n` +
      `├◆ ${p}llama — Llama 3 (Meta)\n` +
      `├◆ ${p}codellama — CodeLlama (Meta)\n` +
      `├◆ ${p}vicuna — Vicuna (fine-tuned Llama)\n` +
      `├◆ ${p}tinyllama — TinyLlama (1.1B)\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟢 *MIXTURE OF EXPERTS*\n` +
      `├◆ ${p}mixtral — Mixtral MoE\n` +
      `├◆ ${p}phi — Phi (Microsoft)\n` +
      `├◆ ${p}neural — NeuralChat (Intel)\n` +
      `├◆ ${p}orca — Orca (Microsoft)\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟡 *OPEN SOURCE MODELS*\n` +
      `├◆ ${p}falcon — Falcon (TII)\n` +
      `├◆ ${p}openchat — OpenChat\n` +
      `├◆ ${p}wizard — WizardLM\n` +
      `├◆ ${p}zephyr — Zephyr (HuggingFace)\n` +
      `├◆ ${p}dolphin — Dolphin\n` +
      `├◆ ${p}nous — Nous Hermes\n` +
      `├◆ ${p}openhermes — OpenHermes\n` +
      `├◆ ${p}solar — Solar (Upstage)\n` +
      `├◆ ${p}yi — Yi (01.AI)\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟠 *CODE AI MODELS*\n` +
      `├◆ ${p}starcoder — StarCoder (HuggingFace)\n` +
      `├◆ ${p}replitai — Replit AI\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🔴 *ENTERPRISE & RESEARCH*\n` +
      `├◆ ${p}qwen — Qwen (Alibaba)\n` +
      `├◆ ${p}commandr — Command R (Cohere)\n` +
      `├◆ ${p}nemotron — Nemotron (NVIDIA)\n` +
      `├◆ ${p}internlm — InternLM (Shanghai AI)\n` +
      `├◆ ${p}chatglm — ChatGLM (Tsinghua)\n` +
      `└─⧭\n\n` +

      `┌─⧭ ⚫ *SPECIAL MODELS*\n` +
      `├◆ ${p}wormgpt — WormGPT\n` +
      `├◆ ${p}wolf — Wolf AI (Auto-reply)\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🖼️ *AI IMAGE & VISION*\n` +
      `├◆ ${p}vision — Image analysis\n` +
      `├◆ ${p}geminivision — Gemini Vision\n` +
      `├◆ ${p}flux — Flux image gen\n` +
      `├◆ ${p}removebg — Background remover\n` +
      `├◆ ${p}aiscanner — AI scanner\n` +
      `└─⧭\n\n` +

      `┌─⧭ 📝 *AI WRITING TOOLS*\n` +
      `├◆ ${p}summarize — Text summarizer\n` +
      `├◆ ${p}humanizer — AI humanizer\n` +
      `├◆ ${p}speechwriter — Speech writer\n` +
      `├◆ ${p}analyze — Content analyzer\n` +
      `└─⧭\n\n` +

      `> ⚡ _${botName} • ${Object.keys({}).length || 35}+ AI Models_`;

    try {
      const media = await getAIMenuImage();

      if (media.type === 'buffer') {
        await sock.sendMessage(jid, {
          image: media.buffer,
          caption,
          mimetype: 'image/jpeg'
        }, { quoted: fkontak });
      } else {
        await sock.sendMessage(jid, {
          image: { url: media.url },
          caption,
          mimetype: 'image/jpeg'
        }, { quoted: fkontak });
      }
    } catch {
      await sock.sendMessage(jid, { text: caption }, { quoted: m });
    }
  }
};

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
      `┌─⧭━━━━━━⧭─┐\n` +
      `│ 🤖 *${botName} AI MENU* │\n` +
      `└─⧭━━━━━━⧭─┘\n\n` +

      `┌─⧭ 🔵 *MAJOR AI MODELS*\n` +
      `├◆ ${p}gpt\n` +
      `├◆ ${p}gpt4\n` +
      `├◆ ${p}gpt4o\n` +
      `├◆ ${p}claude\n` +
      `├◆ ${p}gemini\n` +
      `├◆ ${p}mistral\n` +
      `├◆ ${p}deepseek\n` +
      `├◆ ${p}groq\n` +
      `├◆ ${p}cohere\n` +
      `├◆ ${p}venice\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟣 *META LLAMA FAMILY*\n` +
      `├◆ ${p}llama\n` +
      `├◆ ${p}codellama\n` +
      `├◆ ${p}vicuna\n` +
      `├◆ ${p}tinyllama\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟢 *MIXTURE OF EXPERTS*\n` +
      `├◆ ${p}mixtral\n` +
      `├◆ ${p}phi\n` +
      `├◆ ${p}neural\n` +
      `├◆ ${p}orca\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟡 *OPEN SOURCE MODELS*\n` +
      `├◆ ${p}falcon\n` +
      `├◆ ${p}openchat\n` +
      `├◆ ${p}wizard\n` +
      `├◆ ${p}zephyr\n` +
      `├◆ ${p}dolphin\n` +
      `├◆ ${p}nous\n` +
      `├◆ ${p}openhermes\n` +
      `├◆ ${p}solar\n` +
      `├◆ ${p}yi\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🟠 *CODE AI MODELS*\n` +
      `├◆ ${p}starcoder\n` +
      `├◆ ${p}replitai\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🔴 *ENTERPRISE & RESEARCH*\n` +
      `├◆ ${p}qwen\n` +
      `├◆ ${p}commandr\n` +
      `├◆ ${p}nemotron\n` +
      `├◆ ${p}internlm\n` +
      `├◆ ${p}chatglm\n` +
      `└─⧭\n\n` +

      `┌─⧭ ⚫ *SPECIAL MODELS*\n` +
      `├◆ ${p}wormgpt\n` +
      `├◆ ${p}wolf\n` +
      `└─⧭\n\n` +

      `┌─⧭ 🖼️ *AI IMAGE & VISION*\n` +
      `├◆ ${p}vision\n` +
      `├◆ ${p}geminivision\n` +
      `├◆ ${p}flux\n` +
      `├◆ ${p}removebg\n` +
      `├◆ ${p}aiscanner\n` +
      `└─⧭\n\n` +

      `┌─⧭ 📝 *AI WRITING TOOLS*\n` +
      `├◆ ${p}summarize\n` +
      `├◆ ${p}humanizer\n` +
      `├◆ ${p}speechwriter\n` +
      `├◆ ${p}analyze\n` +
      `└─⧭\n\n` +

      `> ⚡ _${botName} • 35+ AI Models_`;

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

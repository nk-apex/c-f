import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

export const XWOLF_BASE = 'https://apis.xwolf.space/api/ai';

const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://apis.xwolf.space',
  'Referer': 'https://apis.xwolf.space/'
};

export async function xwolfChat(endpoint, prompt, timeout = 30000) {
  const { data } = await axios.post(
    `${XWOLF_BASE}/${endpoint}`,
    { prompt },
    { headers: HEADERS, timeout }
  );
  if (data.success === false) {
    const err = data.error || 'AI request failed';
    if (err.toLowerCase().includes('blocked') || err.toLowerCase().includes('suspicious')) {
      throw new Error('⚠️ This AI endpoint is temporarily rate-limited. Please try again in a few minutes.');
    }
    throw new Error(err);
  }
  const reply = data.response || data.answer || data.result;
  if (!reply) throw new Error('Empty response from AI');
  return { reply, model: data.model || endpoint.toUpperCase(), provider: data.provider || 'xwolf' };
}

export function buildAICommand({ endpoint, name, aliases = [], icon, label, desc, timeout = 30000 }) {
  return {
    name,
    aliases,
    description: desc,
    category: 'ai',

    async execute(sock, m, args, PREFIX) {
      const jid = m.key.remoteJid;

      if (!args.length) {
        return sock.sendMessage(jid, {
          text:
            `${icon} *${label} AI*\n\n` +
            `📌 *Usage:* ${PREFIX}${name} [question]\n` +
            `📝 ${desc}\n\n` +
            `💡 *Example:*\n${PREFIX}${name} What is quantum computing?`
        }, { quoted: m });
      }

      const prompt = args.join(' ');
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      try {
        const { reply, model } = await xwolfChat(endpoint, prompt, timeout);

        const truncated = reply.length > 3000
          ? reply.slice(0, 3000) + '\n\n_...response truncated_'
          : reply;

        const text =
          `${icon} *${label} AI*\n\n` +
          `❓ *Question:*\n${prompt}\n\n` +
          `💬 *Answer:*\n${truncated}\n\n` +
          `⚡ _${getBotName()} • ${model}_`;

        await sock.sendMessage(jid, { text }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

      } catch (err) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        const errMsg = err.message || 'Unknown error';
        await sock.sendMessage(jid, {
          text:
            `❌ *${label} Error*\n\n` +
            `${errMsg}\n\n` +
            `💡 Try *${PREFIX}gpt [question]* as an alternative.`
        }, { quoted: m });
      }
    }
  };
}

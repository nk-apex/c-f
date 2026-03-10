import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'golf',
  description: 'Get PGA golf tournament results and leaderboard',
  category: 'sports',
  aliases: ['pga', 'golfscores'],
  usage: 'golf [leaderboard|schedule]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `┌─⧭ ⛳ *PGA GOLF* \n├◆ Usage: *${PREFIX}golf [leaderboard|schedule]*\n├◆ Get PGA golf tournament results and leaderboard\n├◆ Aliases: *${PREFIX}pga*, *${PREFIX}golfscores*\n└─⧭`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const res = await axios.get(`${ESPN_BASE}/golf/pga/scoreboard`, { timeout: 15000 });
      const events = res.data?.events || [];
      if (events.length === 0) throw new Error('No golf events found');

      const sub = args[0].toLowerCase();
      let text = `┌─⧭ ⛳ *PGA GOLF* \n`;

      events.slice(0, 5).forEach(ev => {
        const name = ev.name || 'PGA Tournament';
        const date = ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const status = ev.status?.type?.shortDetail || '';
        text += `├◆ *${name}*\n`;
        text += `│\n`;

        const comp = ev.competitions?.[0];
        const players = comp?.competitors || [];
        if (players.length > 0 && sub === 'leaderboard') {
          players.slice(0, 10).forEach((p, i) => {
            const pName = p.athlete?.displayName || '???';
            const score = p.score || '-';
            const short = pName.length > 20 ? pName.substring(0, 18) + '..' : pName;
            text += `├◆ *${i + 1}.* ${short} │ ${score}\n`;
          });
        }
      });
      text += `└─⧭\n\n⚡ *Powered by ${getBotName()}*`;

      await sock.sendMessage(jid, { text }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [GOLF]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `┌─⧭ ❌ *GOLF ERROR* \n├◆ ${error.message}\n├◆ Try again later\n└─⧭`
      }, { quoted: m });
    }
  }
};

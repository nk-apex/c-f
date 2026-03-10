import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export default {
  name: 'hockey',
  description: 'Get NHL hockey scores and standings',
  category: 'sports',
  aliases: ['nhl', 'icehockey'],
  usage: 'hockey [scores|standings]',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🏒 *NHL HOCKEY* \n├◆ Usage: *${PREFIX}hockey [scores|standings]*\n├◆ Get NHL hockey scores and standings\n├◆ Aliases: *${PREFIX}nhl*, *${PREFIX}icehockey*\n└─⧭`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
      const sub = args[0].toLowerCase();

      if (sub === 'standings') {
        const res = await axios.get(`${ESPN_BASE}/hockey/nhl/standings`, { timeout: 15000 });
        const groups = res.data?.children || [];
        let text = `┌─⧭ 🏒 *NHL STANDINGS* \n`;

        for (const group of groups.slice(0, 2)) {
          const conf = group.name || 'Conference';
          text += `├◆ 📋 *${conf}*\n`;
          const divs = group.children || [];
          for (const div of divs.slice(0, 4)) {
            text += `├◆ *${div.name || 'Division'}*\n`;
            const entries = div.standings?.entries || [];
            entries.slice(0, 4).forEach((team, i) => {
              const s = team.stats || [];
              const w = s.find(x => x.name === 'wins')?.value || 0;
              const l = s.find(x => x.name === 'losses')?.value || 0;
              const pts = s.find(x => x.name === 'points')?.value || 0;
              const name = team.team?.abbreviation || '???';
              text += ``;
            });
          }
        }
        text += `└─⧭\n\n⚡ *Powered by ${getBotName()}*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      } else {
        const res = await axios.get(`${ESPN_BASE}/hockey/nhl/scoreboard`, { timeout: 15000 });
        const events = res.data?.events || [];
        if (events.length === 0) throw new Error('No NHL games found today');

        let text = `┌─⧭ 🏒 *NHL SCORES* \n`;
        events.slice(0, 15).forEach(ev => {
          const comp = ev.competitions?.[0];
          const teams = comp?.competitors || [];
          const home = teams.find(t => t.homeAway === 'home');
          const away = teams.find(t => t.homeAway === 'away');
          const status = ev.status?.type?.shortDetail || '';
          text += `├◆ ${away?.team?.abbreviation || '???'} *${away?.score || '0'}* @ ${home?.team?.abbreviation || '???'} *${home?.score || '0'}*\n`;
          text += ``;
        });
        text += `└─⧭\n\n⚡ *Powered by ${getBotName()}*`;
        await sock.sendMessage(jid, { text }, { quoted: m });
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (error) {
      console.error('❌ [HOCKEY]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `┌─⧭ ❌ *HOCKEY ERROR* \n├◆ ${error.message}\n├◆ Try again later\n└─⧭`
      }, { quoted: m });
    }
  }
};

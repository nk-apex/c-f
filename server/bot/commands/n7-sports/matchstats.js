import axios from 'axios';
import { getBotName } from '../../lib/botname.js';

const API_BASE = 'https://apis.xcasper.space/api/sports';

export default {
  name: 'matchstats',
  description: 'Get detailed statistics for a specific match',
  category: 'sports',
  alias: ['mstats', 'matchinfo'],
  usage: 'matchstats <matchId>',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    if (args.length === 0 || args[0].toLowerCase() === 'help') {
      return sock.sendMessage(jid, {
        text: `┌─⧭ 📊 *MATCH STATISTICS* \n` +
          `├◆ *${PREFIX}matchstats <matchId>*\n` +
          `│  └⊷ Get detailed stats for a match\n` +
          `│\n` +
          `├◆ 💡 *Example:*\n` +
          `│  ⊷ ${PREFIX}matchstats 551333\n` +
          `│\n` +
          `├◆ ℹ️ *How to find match IDs:*\n` +
          `│  ⊷ Use ${PREFIX}football scores\n` +
          `│  ⊷ Match IDs shown with results\n` +
          `└─⧭`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

      const matchId = args[0];
      const res = await axios.get(`${API_BASE}?action=matchstats&matchId=${matchId}`, { timeout: 20000 });
      const data = res.data;

      if (!data) throw new Error('No match data found');

      const matchData = data?.match || data?.data || data;
      const home = matchData?.homeTeam?.name || matchData?.home?.name || matchData?.teams?.home?.name || 'Home';
      const away = matchData?.awayTeam?.name || matchData?.away?.name || matchData?.teams?.away?.name || 'Away';
      const homeScore = matchData?.homeScore ?? matchData?.score?.home ?? matchData?.goals?.home ?? '-';
      const awayScore = matchData?.awayScore ?? matchData?.score?.away ?? matchData?.goals?.away ?? '-';
      const status = matchData?.status || matchData?.state || matchData?.matchStatus || '';
      const venue = matchData?.venue || matchData?.stadium || '';
      const league = matchData?.league?.name || matchData?.competition?.name || '';

      let text = `┌─⧭ 📊 *MATCH STATISTICS* \n`;
      text += `├◆ *${home}* ${homeScore} - ${awayScore} *${away}*\n`;
      if (status) text += `├◆ Status: ${status}\n`;
      if (league) text += `├◆ League: ${league}\n`;
      if (venue) text += `├◆ Venue: ${venue}\n`;
      text += `│\n`;

      const stats = matchData?.statistics || matchData?.stats || data?.statistics || data?.stats;
      if (Array.isArray(stats)) {
        text += `├◆ 📋 *Match Stats:*\n`;
        stats.forEach(stat => {
          const name = stat?.name || stat?.label || stat?.type || stat?.displayName || 'Stat';
          const homeVal = stat?.home ?? stat?.homeValue ?? stat?.values?.[0] ?? '-';
          const awayVal = stat?.away ?? stat?.awayValue ?? stat?.values?.[1] ?? '-';
          text += `│  ⊷ ${homeVal} │ *${name}* │ ${awayVal}\n`;
        });
      } else if (stats && typeof stats === 'object') {
        text += `├◆ 📋 *Match Stats:*\n`;
        Object.entries(stats).slice(0, 15).forEach(([key, val]) => {
          if (typeof val === 'object' && val !== null) {
            const homeVal = val?.home ?? val?.[0] ?? '-';
            const awayVal = val?.away ?? val?.[1] ?? '-';
            text += `│  ⊷ ${homeVal} │ *${key}* │ ${awayVal}\n`;
          } else {
            text += `│  ⊷ *${key}:* ${val}\n`;
          }
        });
      }

      const events = matchData?.events || matchData?.incidents || matchData?.timeline;
      if (Array.isArray(events) && events.length > 0) {
        text += `│\n├◆ ⚡ *Key Events:*\n`;
        events.slice(0, 10).forEach(ev => {
          const minute = ev?.minute || ev?.time || ev?.clock || '';
          const type = ev?.type || ev?.eventType || ev?.incident || '';
          const player = ev?.player?.name || ev?.playerName || ev?.player || '';
          const team = ev?.team?.name || ev?.teamName || '';
          text += `│  ⊷ ${minute}' │ ${type}${player ? ` - ${player}` : ''}${team ? ` (${team})` : ''}\n`;
        });
      }

      const lineups = matchData?.lineups || matchData?.formations;
      if (lineups) {
        const homeLineup = lineups?.home || lineups?.[0];
        const awayLineup = lineups?.away || lineups?.[1];
        if (homeLineup?.formation || awayLineup?.formation) {
          text += `│\n├◆ 📝 *Formations:*\n`;
          if (homeLineup?.formation) text += `│  ⊷ ${home}: ${homeLineup.formation}\n`;
          if (awayLineup?.formation) text += `│  ⊷ ${away}: ${awayLineup.formation}\n`;
        }
      }

      text += `└─⧭\n\n⚡ *Powered by ${getBotName()}*`;
      await sock.sendMessage(jid, { text }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      console.log(`📊 [MATCHSTATS] Stats for match ${matchId} fetched`);

    } catch (error) {
      console.error('❌ [MATCHSTATS]', error.message);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(jid, {
        text: `┌─⧭ ❌ *MATCH STATS ERROR* \n├◆ ${error.message}\n├◆ Make sure the match ID is correct\n├◆ Usage: ${PREFIX}matchstats <matchId>\n└─⧭`
      }, { quoted: m });
    }
  }
};

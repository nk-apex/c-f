import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: 'sportsmenu',
  description: 'View all available sports commands',
  category: 'sports',
  aliases: ['sports', 'sport', 'sportlist'],
  usage: 'sportsmenu',

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const commandsText = `┌─⧭⊷ *⚽ FOOTBALL / SOCCER*
├◆  • football scores
├◆  • football standings
├◆  • football fixtures
├◆  • football topscorers
├◆  • football stats
├◆  _Leagues: epl, laliga, bundesliga, seriea, ligue1_
└─⧭⊷

┌─⧭⊷ *📊 MATCH STATISTICS*
├◆  • matchstats
└─⧭⊷

┌─⧭⊷ *📰 SPORTS NEWS*
├◆  • sportsnews
├◆  • teamnews
└─⧭⊷

┌─⧭⊷ *🏀 NBA BASKETBALL*
├◆  • basketball scores
├◆  • basketball standings
└─⧭⊷

┌─⧭⊷ *🏏 CRICKET*
├◆  • cricket scores
└─⧭⊷

┌─⧭⊷ *🏈 NFL FOOTBALL*
├◆  • nfl scores
├◆  • nfl standings
└─⧭⊷

┌─⧭⊷ *🏎️ FORMULA 1*
├◆  • f1 results
├◆  • f1 standings
└─⧭⊷

┌─⧭⊷ *🥊 UFC / MMA*
├◆  • mma results
├◆  • mma schedule
└─⧭⊷

┌─⧭⊷ *🎾 TENNIS*
├◆  • tennis scores
└─⧭⊷

┌─⧭⊷ *⚾ MLB BASEBALL*
├◆  • baseball scores
├◆  • baseball standings
└─⧭⊷

┌─⧭⊷ *🏒 NHL HOCKEY*
├◆  • hockey scores
├◆  • hockey standings
└─⧭⊷

┌─⧭⊷ *⛳ PGA GOLF*
├◆  • golf leaderboard
├◆  • golf schedule
└─⧭⊷`;

    await sendSubMenu(sock, jid, '🏆 SPORTS MENU', commandsText, m, PREFIX);
  }
};

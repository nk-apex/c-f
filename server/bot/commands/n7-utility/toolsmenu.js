import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "toolsmenu",
  alias: ["utilitymenu", "utilmenu", "toolshelp"],
  desc: "Shows utility and tools commands",
  category: "Utility",
  usage: ".toolsmenu",

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *📰 NEWS*
│
├◆  • citizennews
├◆  • bbcnews
├◆  • ntvnews
├◆  • kbcnews
├◆  • technews
│
╰─⊷

╭─⊷ *🔍 INFO & SEARCH*
│
├◆  • alive
├◆  • ping
├◆  • ping2
├◆  • time
├◆  • uptime
├◆  • define
├◆  • news
├◆  • covid
├◆  • weather
├◆  • wiki
├◆  • translate
├◆  • calc
├◆  • iplookup
├◆  • getip
├◆  • getpp
├◆  • getgpp
├◆  • prefixinfo
│
╰─⊷

╭─⊷ *🔗 CONVERSION & MEDIA*
│
├◆  • shorturl
├◆  • url
├◆  • fetch
├◆  • qrencode
├◆  • take
├◆  • imgbb
├◆  • save
├◆  • screenshot
├◆  • inspect
│
╰─⊷

╭─⊷ *📇 CONTACT TOOLS*
│
├◆  • vcf
├◆  • viewvcf
├◆  • vv
├◆  • vv2
│
╰─⊷`;

    await sendSubMenu(sock, jid, '✨ Tools & Utility Menu', commandsText, m, PREFIX);
  }
};

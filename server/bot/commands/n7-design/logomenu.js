import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "logomenu",
  alias: ["logos", "logohelp", "logocmds", "designmenu"],
  desc: "Shows logo design commands",
  category: "Design",
  usage: ".logomenu",

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const commandsText = `╭─⊷ *🌟 PREMIUM METALS*
│
├◆  • goldlogo
├◆  • silverlogo
├◆  • platinumlogo
├◆  • chromelogo
├◆  • diamondlogo
├◆  • bronzelogo
├◆  • steellogo
├◆  • copperlogo
├◆  • titaniumlogo
│
╰─⊷

╭─⊷ *🔥 ELEMENTAL EFFECTS*
│
├◆  • firelogo
├◆  • icelogo
├◆  • iceglowlogo
├◆  • lightninglogo
├◆  • rainbowlogo
├◆  • sunlogo
├◆  • moonlogo
│
╰─⊷

╭─⊷ *🎭 MYTHICAL & MAGICAL*
│
├◆  • dragonlogo
├◆  • phoenixlogo
├◆  • wizardlogo
├◆  • crystallogo
├◆  • darkmagiclogo
│
╰─⊷

╭─⊷ *🌌 DARK & GOTHIC*
│
├◆  • shadowlogo
├◆  • smokelogo
├◆  • bloodlogo
│
╰─⊷

╭─⊷ *💫 GLOW & NEON*
│
├◆  • neonlogo
├◆  • glowlogo
├◆  • gradientlogo
├◆  • matrixlogo
├◆  • aqualogo
│
╰─⊷`;

    await sendSubMenu(sock, jid, '🎨 LOGO DESIGN MENU', commandsText, m, PREFIX);
  }
};

export default {
  name: "rules",
  alias: ["grouprules", "guidelines"],
  description: "Set or view group rules",
  category: "group",
  ownerOnly: false,
  groupOnly: true,
  adminOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (!args.length) {
      const defaultRules = `📜 *GROUP RULES*\n\n` +
                          `1. Be respectful to everyone\n` +
                          `2. No spam or flooding\n` +
                          `3. No NSFW content\n` +
                          `4. No advertising without permission\n` +
                          `5. Use appropriate language\n` +
                          `6. Follow WhatsApp Terms of Service\n\n` +
                          `⚠️ Violators may be warned/kicked\n` +
                          `✅ Admins have final say\n\n` +
                          `To set custom rules:\n` +
                          `${PREFIX}rules set <rule1> | <rule2> | ...`;
      
      return sock.sendMessage(jid, {
        text: defaultRules
      }, { quoted: m });
    }
    
    const action = args[0].toLowerCase();
    
    if (action === "set") {
      const rulesText = args.slice(1).join(" ");
      const rules = rulesText.split("|").map(r => r.trim());
      
      if (rules.length === 0) {
        return sock.sendMessage(jid, {
          text: `❌ No rules provided! Use | to separate rules.\n\n` +
                `Example: ${PREFIX}rules set Be respectful | No spam | No ads`
        }, { quoted: m });
      }
      
      let rulesMsg = `📜 *GROUP RULES SET*\n\n`;
      
      rules.forEach((rule, i) => {
        rulesMsg += `${i + 1}. ${rule}\n`;
      });
      
      rulesMsg += `\n✅ Rules updated by ${m.pushName || "Admin"}`;
      
      return sock.sendMessage(jid, {
        text: rulesMsg
      }, { quoted: m });
    }
    
    return sock.sendMessage(jid, {
      text: `❌ Invalid command! Use ${PREFIX}rules for help.`
    }, { quoted: m });
  }
};
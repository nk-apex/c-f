export default {
  name: "setprefix",
  alias: ["prefix", "changeprefix", "resetprefix"],
  description: "Change or reset the bot's command prefix",
  category: "Config",
  usage: ".setprefix <new_prefix>\n.setprefix reset\nExample: .setprefix !\nExample: .setprefix reset",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager, prefixHandler } = extra; // Now uses prefixHandler
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    await sock.sendMessage(chatId, {
      react: { text: "⚙️", key: m.key }
    });
    
    try {
      const action = args[0]?.toLowerCase();
      
      // Show help if no args
      if (!action) {
        await sendMessage(
          `⚙️ *Prefix Configuration*\n\n` +
          `*Current Prefix:* \`${PREFIX}\`\n\n` +
          `*Usage:*\n` +
          `• ${PREFIX}setprefix <new_symbol> - Change prefix\n` +
          `• ${PREFIX}setprefix reset - Reset to default (.)\n` +
          `• ${PREFIX}setprefix info - Show current prefix\n\n` +
          `*Examples:*\n` +
          `• ${PREFIX}setprefix !\n` +
          `• ${PREFIX}setprefix /\n` +
          `• ${PREFIX}setprefix reset\n\n` +
          `*Valid Symbols:* ! . / $ # * ~ & % + - = ?`
        );
        return;
      }
      
      // Handle reset
      if (action === 'reset') {
        const result = prefixHandler.resetPrefix(chatId);
        
        await sock.sendMessage(chatId, {
          react: { text: "🔄", key: m.key }
        });
        
        await sendMessage(
          `🔄 *Prefix Reset*\n\n` +
          `${result.message}\n\n` +
          `Now use: ${result.newPrefix}command\n` +
          `Example: ${result.newPrefix}play Believer`
        );
        return;
      }
      
      // Handle info
      if (action === 'info' || action === 'status') {
        const currentPrefix = prefixHandler.getPrefix(chatId);
        
        await sendMessage(
          `ℹ️ *Prefix Information*\n\n` +
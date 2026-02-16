export default {
  name: "setprefix",
  alias: ["prefix", "changeprefix", "resetprefix"],
  description: "Change or reset the bot's command prefix",
  category: "owner",
  ownerOnly: true,
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { prefixHandler } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action) {
        await sendMessage(
          `*Prefix Configuration*\n\n` +
          `*Current Prefix:* \`${PREFIX}\`\n\n` +
          `*Usage:*\n` +
          `${PREFIX}setprefix <new_symbol> - Change prefix\n` +
          `${PREFIX}setprefix reset - Reset to default (.)\n` +
          `${PREFIX}setprefix info - Show current prefix\n\n` +
          `*Examples:*\n` +
          `${PREFIX}setprefix !\n` +
          `${PREFIX}setprefix /\n` +
          `${PREFIX}setprefix reset\n\n` +
          `*Valid Symbols:* ! . / $ # * ~ & % + - = ?`
        );
        return;
      }
      
      if (action === 'reset') {
        const result = prefixHandler.resetPrefix();
        await sendMessage(
          `*Prefix Reset*\n\n` +
          `${result.message}\n\n` +
          `Now use: ${result.newPrefix}command\n` +
          `Example: ${result.newPrefix}play Believer`
        );
        return;
      }
      
      if (action === 'info' || action === 'status') {
        const currentPrefix = prefixHandler.getPrefix();
        await sendMessage(
          `*Prefix Information*\n\n` +
          `Current Prefix: \`${currentPrefix}\``
        );
        return;
      }
      
      const validPrefixes = ['!', '.', '/', '$', '#', '*', '~', '&', '%', '+', '-', '=', '?'];
      if (!validPrefixes.includes(action) && action.length > 3) {
        await sendMessage(
          `Invalid prefix. Use one of: ${validPrefixes.join(' ')}\nOr any symbol up to 3 characters.`
        );
        return;
      }
      
      const result = prefixHandler.setPrefix(action);
      await sendMessage(
        `*Prefix Changed*\n\n` +
        `${result.message}\n\n` +
        `Now use: ${result.newPrefix}command\n` +
        `Example: ${result.newPrefix}help`
      );
      
    } catch (error) {
      await sendMessage(`Error: ${error.message}`);
    }
  }
};

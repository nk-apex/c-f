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
          `\u250C\u2500\u29ED *Prefix Config*\n` +
          `\u251C\u25C6 Current: [${PREFIX}]\n` +
          `\u251C\u25C6 Change: ${PREFIX}setprefix <symbol>\n` +
          `\u251C\u25C6 Reset: ${PREFIX}setprefix reset\n` +
          `\u251C\u25C6 Valid: ! . / $ # * ~ & % + - = ?\n` +
          `\u2514\u2500\u29ED`
        );
        return;
      }

      if (action === 'reset') {
        const result = prefixHandler.resetPrefix();
        await sendMessage(
          `\u250C\u2500\u29ED *Prefix Reset*\n` +
          `\u251C\u25C6 ${result.message}\n` +
          `\u251C\u25C6 Use: ${result.newPrefix}command\n` +
          `\u2514\u2500\u29ED`
        );
        return;
      }

      if (action === 'info' || action === 'status') {
        const currentPrefix = prefixHandler.getPrefix();
        await sendMessage(
          `\u250C\u2500\u29ED *Prefix Info*\n` +
          `\u251C\u25C6 Current: [${currentPrefix}]\n` +
          `\u2514\u2500\u29ED`
        );
        return;
      }

      const validPrefixes = ['!', '.', '/', '$', '#', '*', '~', '&', '%', '+', '-', '=', '?', ','];
      if (!validPrefixes.includes(action) && action.length > 3) {
        await sendMessage(
          `\u250C\u2500\u29ED *Invalid Prefix*\n` +
          `\u251C\u25C6 Use one of: ${validPrefixes.join(' ')}\n` +
          `\u2514\u2500\u29ED`
        );
        return;
      }

      const result = prefixHandler.setPrefix(action);
      await sendMessage(
        `\u250C\u2500\u29ED *Prefix Changed*\n` +
        `\u251C\u25C6 ${result.message}\n` +
        `\u251C\u25C6 Use: ${result.newPrefix}command\n` +
        `\u2514\u2500\u29ED`
      );

    } catch (error) {
      await sendMessage(`Error: ${error.message}`);
    }
  }
};

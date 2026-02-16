export default {
    name: 'findcommands',
    alias: ['searchcmd', 'findcmd'],
    category: 'owner',
    description: 'Search through loaded commands by name',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const commands = extra?.commands;

        if (!args[0]) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Find Commands*\n\u251C\u25C6 Usage: ${PREFIX}findcommands <query>\n\u251C\u25C6 Example: ${PREFIX}findcommands ping\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        const query = args[0].toLowerCase();
        const results = [];

        if (commands && commands instanceof Map) {
            for (const [name, cmd] of commands) {
                if (name.toLowerCase().includes(query)) {
                    results.push({
                        name: cmd.name || name,
                        category: cmd.category || 'unknown',
                        aliases: cmd.alias ? cmd.alias.join(', ') : 'none'
                    });
                }
            }
        }

        if (results.length === 0) {
            await sock.sendMessage(chatId, {
                text: `\u250C\u2500\u29ED *Search Results*\n\u251C\u25C6 Query: "${query}"\n\u251C\u25C6 No commands found\n\u2514\u2500\u29ED`
            }, { quoted: m });
            return;
        }

        let resultText = '';
        for (const r of results) {
            resultText += `\u251C\u25C6 ${r.name} [${r.category}]\n\u251C  Aliases: ${r.aliases}\n`;
        }

        await sock.sendMessage(chatId, {
            text: `\u250C\u2500\u29ED *Search Results*\n\u251C\u25C6 Query: "${query}"\n\u251C\u25C6 Found: ${results.length}\n${resultText}\u2514\u2500\u29ED`
        }, { quoted: m });
    }
};

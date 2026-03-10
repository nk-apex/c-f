import { getBadWords } from '../../lib/badwords-store.js';

export default {
    name: 'listbadword',
    alias: ['listswear', 'badwords', 'badwordlist'],
    description: 'List all words in the bad word filter',
    category: 'group',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const words = getBadWords();

        if (words.length === 0) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ 🤬 *BAD WORD FILTER* \n├◆ No bad words added yet.\n├◆ Use *.addbadword <word>* to add words\n└─⧭`,
            }, { quoted: msg });
        }

        const numbered = words.map((w, i) => `│  ${i + 1}. ${w}`).join('\n');
        return sock.sendMessage(chatId, {
            text: `┌─⧭ 🤬 *BAD WORD FILTER* \n├◆ *Total:* ${words.length} word(s)\n${numbered}\n├◆ Use *.removebadword <word>* to remove\n├◆ Use *.antibadword on/off* to toggle\n└─⧭`,
        }, { quoted: msg });
    }
};

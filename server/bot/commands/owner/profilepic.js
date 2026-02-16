export default {
    name: 'profilepic',
    alias: ['ppview', 'profileview'],
    category: 'owner',
    description: 'Profile picture viewing info',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const text = `\u250C\u2500\u29ED *Profile Picture Settings*\n` +
            `\u251C\u25C6 View your profile picture privacy\n` +
            `\u251C\u25C6 Controls who can see your PP\n` +
            `\u2514\u2500\u29ED\n\n` +
            `\u250C\u2500\u29ED *Related Commands*\n` +
            `\u251C\u25C6 ${PREFIX}privacy profile-photo all\n` +
            `\u251C\u25C6 ${PREFIX}privacy profile-photo contacts\n` +
            `\u251C\u25C6 ${PREFIX}privacy profile-photo none\n` +
            `\u251C\u25C6 ${PREFIX}getpp - View a user's PP\n` +
            `\u251C\u25C6 ${PREFIX}setpp - Set bot's PP\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

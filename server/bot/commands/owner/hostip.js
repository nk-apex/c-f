import os from 'os';

export default {
    name: 'hostip',
    alias: ['serverinfo', 'host'],
    category: 'owner',
    description: 'Show hosting and server info',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        let platform = 'Unknown';
        if (process.env.REPL_ID || process.env.REPL_SLUG) platform = 'Replit';
        else if (process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PROJECT_ID) platform = 'Railway';
        else if (process.env.RENDER_SERVICE_ID) platform = 'Render';
        else if (process.env.HEROKU_APP_ID) platform = 'Heroku';
        else if (process.env.VERCEL) platform = 'Vercel';
        else if (process.env.AWS_REGION) platform = 'AWS';
        else platform = 'Self-hosted / VPS';

        const cpus = os.cpus();
        const text = `\u250C\u2500\u29ED *Host Info*\n` +
            `\u251C\u25C6 Platform: ${platform}\n` +
            `\u251C\u25C6 Node: ${process.version}\n` +
            `\u251C\u25C6 OS: ${os.type()} ${os.release()}\n` +
            `\u251C\u25C6 Arch: ${os.arch()}\n` +
            `\u251C\u25C6 CPU: ${cpus.length > 0 ? cpus[0].model : 'Unknown'}\n` +
            `\u251C\u25C6 Cores: ${cpus.length}\n` +
            `\u251C\u25C6 Hostname: ${os.hostname()}\n` +
            `\u251C\u25C6 Total RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `\u2514\u2500\u29ED`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};

import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export default {
    name: 'zip',
    alias: ['botzip', 'getbot', 'botfile', 'botcode'],
    description: 'Get the bot source code as a ZIP file',
    category: 'utility',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extras) {
        const chatId = m.key.remoteJid;
        const repoUrl = 'https://github.com/7silent-wolf/FOXY';
        const repoFullName = '7silent-wolf/FOXY';
        const repoName = 'FOXY';

        try {
            try { await sock.sendMessage(chatId, { react: { text: '⏳', key: m.key } }); } catch {}

            if (!fs.existsSync(path.join(os.tmpdir(), 'foxbot_tmp'))) fs.mkdirSync(path.join(os.tmpdir(), 'foxbot_tmp'), { recursive: true });
            const zipPath = `./temp/${repoName}_${Date.now()}.zip`;

            let downloaded = false;

            for (const branch of ['main', 'master']) {
                if (downloaded) break;
                try {
                    const zipUrl = `https://github.com/${repoFullName}/archive/refs/heads/${branch}.zip`;
                    const response = await axios({
                        method: 'GET',
                        url: zipUrl,
                        responseType: 'stream',
                        timeout: 120000,
                        maxContentLength: 200 * 1024 * 1024
                    });
                    const writer = createWriteStream(zipPath);
                    await pipeline(response.data, writer);
                    downloaded = true;
                } catch {}
            }

            if (!downloaded || !fs.existsSync(zipPath)) {
                throw new Error('Failed to download bot files. Repository may be unavailable.');
            }

            try { await sock.sendMessage(chatId, { react: { text: '📤', key: m.key } }); } catch {}

            const zipSize = fs.statSync(zipPath).size;
            const sizeMB = (zipSize / (1024 * 1024)).toFixed(2);

            if (zipSize > 100 * 1024 * 1024) {
                throw new Error(`ZIP too large (${sizeMB}MB). Max is 100MB.`);
            }

            let repoInfo = '';
            try {
                const apiResp = await axios.get(`https://api.github.com/repos/${repoFullName}`, { timeout: 5000 });
                const data = apiResp.data;
                repoInfo =
                    `├◆ ✧ *Stars:* ${data.stargazers_count || 0}\n` +
                    `├◆ ✧ *Forks:* ${data.forks_count || 0}\n` +
                    `├◆ ✧ *Language:* ${data.language || 'N/A'}\n` +
                    `├◆ ✧ *Updated:* ${new Date(data.updated_at).toLocaleDateString()}\n`;
            } catch {}

            await sock.sendMessage(chatId, {
                document: fs.readFileSync(zipPath),
                fileName: `${repoName}.zip`,
                mimetype: 'application/zip',
                caption:
                    `┌─⧭ 🐺 *WOLF BOT* \n` +
                    `├◆ ✧ *Repo:* ${repoFullName}\n` +
                    `├◆ ✧ *Size:* ${sizeMB}MB\n` +
                    `${repoInfo}` +
                    `├◆ 📦 Bot source code\n` +
                    `├◆ 🔗 github.com/${repoFullName}\n` +
                    `├◆ *Related:*\n` +
                    `├◆ • \`${PREFIX}gitclone user/repo\` - Clone any repo\n` +
                    `├◆ • \`${PREFIX}gitinfo user/repo\` - Repo details\n` +
                    `└─⧭`
            }, { quoted: m });

            setTimeout(() => {
                try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch {}
            }, 30000);

            try { await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } }); } catch {}

        } catch (error) {
            console.error('ZIP command error:', error);

            await sock.sendMessage(chatId, {
                text:
                    `┌─⧭ ❌ *ZIP FAILED* \n` +
                    `├◆ ✧ *Error:* ${error.message}\n` +
                    `├◆ 💡 Try again later or use:\n` +
                    `├◆ • \`${PREFIX}gitclone ${repoFullName}\`\n` +
                    `└─⧭`
            }, { quoted: m });

            try { await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } }); } catch {}
        }
    }
};

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MENU_IMAGE_URL = 'https://i.ibb.co/b5Jx5Trp/63a1f423d038.jpg';

function getCurrentDateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneShort = timezone.split('/').pop() || timezone;

    return {
        time: `${formattedHours}:${minutes} ${ampm}`,
        date: `${dayName}, ${monthName} ${date}, ${year}`,
        timezone: timezoneShort,
        full: `${formattedHours}:${minutes} ${ampm} | ${dayName}, ${monthName} ${date} | ${timezoneShort}`
    };
}

function getSystemInfo(startTime) {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.rss / 1024 / 1024);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedSysMem = totalMem - freeMem;
    const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(0);
    const ramPercent = Math.round((usedSysMem / totalMem) * 100);
    const filledBlocks = Math.round(ramPercent / 10);
    const emptyBlocks = 10 - filledBlocks;
    const ramBar = '\u2588'.repeat(filledBlocks) + '\u2591'.repeat(emptyBlocks);

    let platform = 'Unknown';
    if (process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN) {
        platform = 'Replit';
    } else if (process.env.RAILWAY_ENVIRONMENT) {
        platform = 'Railway';
    } else if (process.env.RENDER) {
        platform = 'Render';
    } else if (process.env.HEROKU_APP_NAME) {
        platform = 'Heroku';
    } else if (process.env.VERCEL) {
        platform = 'Vercel';
    } else {
        const p = os.platform();
        if (p === 'win32') platform = 'Windows';
        else if (p === 'darwin') platform = 'macOS';
        else if (p === 'linux') platform = 'Linux';
        else if (p === 'android') platform = 'Android';
        else platform = p;
    }

    let uptimeStr = '';
    if (startTime) {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const days = Math.floor(diff / 86400);
        const hrs = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;
        if (days > 0) uptimeStr += `${days}d `;
        if (hrs > 0) uptimeStr += `${hrs}h `;
        uptimeStr += `${mins}m ${secs}s`;
    } else {
        const upSec = Math.floor(process.uptime());
        const mins = Math.floor(upSec / 60);
        const secs = upSec % 60;
        uptimeStr = `${mins}m ${secs}s`;
    }

    return { usedMB, totalGB, ramPercent, ramBar, platform, uptimeStr };
}

const READMORE = '\u200E'.repeat(4001);

function buildFoxCoreCaption(prefix, version, context, timeInfo, sysInfo, isOwner, ownerNumber, mode) {
    const ownerDisplay = ownerNumber ? `+${ownerNumber}` : 'Not Set!';
    const cmdCount = context.commands?.size || 0;

    return `\u250C\u2500\u29ED FOX-CORE v${version}
\u251C\u25C6 Time: ${timeInfo.full}
\u251C\u25C6 Commands: ${cmdCount}
\u2514\u2500\u29ED

\u250C\u2500\u29ED BOT INFO
\u251C Owner: ${ownerDisplay}
\u251C Mode: ${mode}
\u251C Host: ${sysInfo.platform}
\u251C Speed: ${sysInfo.speed || '...'} ms
\u251C Prefix: [${prefix}]
\u251C Uptime: ${sysInfo.uptimeStr}
\u251C Version: ${version}
\u251C Usage: ${sysInfo.usedMB} MB of ${sysInfo.totalGB} GB
\u251C RAM: ${sysInfo.ramBar} ${sysInfo.ramPercent}%
\u2514\u2500\u29ED
${READMORE}
\u250C\u2500\u29ED AI MODULES
\u251C\u2500 character
\u251C\u2500 flux
\u251C\u2500 foxy
\u251C\u2500 gpt
\u251C\u2500 teacher
\u251C\u2500 room
\u251C\u2500 story
\u2514\u2500\u29ED

\u250C\u2500\u29ED MEDIA HUB
\u251C\u2500 image
\u251C\u2500 instagram
\u251C\u2500 sticker
\u251C\u2500 video
\u251C\u2500 wallpaper
\u251C\u2500 ytmp4
\u251C\u2500 attp
\u251C\u2500 meme
\u251C\u2500 take
\u251C\u2500 getpp
\u251C\u2500 imgbb
\u251C\u2500 logo
\u251C\u2500 tosticker
\u251C\u2500 vv
\u2514\u2500\u29ED

\u250C\u2500\u29ED AUTO PILOT
\u251C\u2500 autoreact
\u251C\u2500 autoread
\u251C\u2500 autotyping
\u251C\u2500 autorecording
\u251C\u2500 autostatus
\u251C\u2500 autoviewstatus
\u251C\u2500 antidelete
\u251C\u2500 autorec
\u251C\u2500 autotype
\u2514\u2500\u29ED

\u250C\u2500\u29ED PLAYGROUND
\u251C\u2500 compliment
\u251C\u2500 debate
\u251C\u2500 8ball
\u251C\u2500 fact
\u251C\u2500 flip
\u251C\u2500 hangman
\u251C\u2500 hug
\u251C\u2500 joke
\u251C\u2500 quote
\u251C\u2500 roll
\u251C\u2500 tictactoe
\u251C\u2500 trivia
\u251C\u2500 slap
\u2514\u2500\u29ED

\u250C\u2500\u29ED UTILITIES
\u251C\u2500 menu
\u251C\u2500 help
\u251C\u2500 goodmorning
\u251C\u2500 status
\u251C\u2500 uptime
\u251C\u2500 warn
\u251C\u2500 bible
\u251C\u2500 quran
\u251C\u2500 wiki
\u251C\u2500 lyrics
\u251C\u2500 ping
\u251C\u2500 time
\u251C\u2500 timer
\u251C\u2500 translate
\u251C\u2500 tts
\u251C\u2500 weather
\u2514\u2500\u29ED

\u250C\u2500\u29ED GROUP OPS
\u251C\u2500 add
\u251C\u2500 antilink
\u251C\u2500 demote
\u251C\u2500 goodbye
\u251C\u2500 groupinfo
\u251C\u2500 group
\u251C\u2500 hidetag
\u251C\u2500 kick
\u251C\u2500 listadmins
\u251C\u2500 mute
\u251C\u2500 poll
\u251C\u2500 promote
\u251C\u2500 rules
\u251C\u2500 setdesc
\u251C\u2500 setname
\u251C\u2500 tagall
\u251C\u2500 togstatus
\u2514\u2500\u29ED

\u250C\u2500\u29ED TOOLKIT
\u251C\u2500 play
\u251C\u2500 calc
\u251C\u2500 logo
\u251C\u2500 setpp
\u251C\u2500 stopwatch
\u251C\u2500 story
\u2514\u2500\u29ED

\u250C\u2500\u29ED SYSTEM
${isOwner ?
`\u251C\u2500 setprefix
\u251C\u2500 setbotname
\u251C\u2500 mode` :
'\u251C\u2500 [OWNER PANEL]'}
\u2514\u2500\u29ED

\u250C\u2500\u29ED INFO
\u251C\u25C6 Version: ${version}
\u251C\u25C6 Help: ${prefix}help [command]
\u2514\u2500\u29ED`;
}

let cachedImageBuffer = null;

async function fetchMenuImage() {
    if (cachedImageBuffer) return cachedImageBuffer;
    try {
        const response = await axios.get(MENU_IMAGE_URL, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });
        cachedImageBuffer = Buffer.from(response.data);
        return cachedImageBuffer;
    } catch (err) {
        return null;
    }
}

export default {
    name: 'menu',
    alias: ['help', 'cmd', 'commands', 'start', 'foxymenu'],
    category: 'general',
    description: 'Show all available commands',
    ownerOnly: false,

    async execute(sock, msg, args, prefix, context) {
        const chatId = msg.key.remoteJid;
        const isOwner = context?.isOwner || false;
        const version = '1.0.8';
        const timeInfo = getCurrentDateTime();

        const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');
        let config = { prefix: '.', mode: 'public', ownerNumber: '', botName: 'Foxy Bot' };
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            }
        } catch {}

        const startTime = context?.startTime || null;
        const sysInfo = getSystemInfo(startTime);

        const speedStart = Date.now();
        await sock.sendMessage(chatId, {
            text: `Loading menu, please wait...`
        }, { quoted: msg });
        const speedEnd = Date.now();
        sysInfo.speed = speedEnd - speedStart;

        const caption = buildFoxCoreCaption(prefix, version, context, timeInfo, sysInfo, isOwner, config.ownerNumber, config.mode);

        try {
            const imageBuffer = await fetchMenuImage();

            if (imageBuffer) {
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: caption,
                    mimetype: 'image/jpeg'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
        }
    }
};

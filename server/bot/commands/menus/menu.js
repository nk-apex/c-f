// commands/general/menu.js - FOX-CORE MENU
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getCurrentMenuStyle } from './menustyle.js';

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

function getPlaceInfo() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    let placeInfo = '';
    if (process.env.COUNTRY || process.env.REGION) {
        const country = process.env.COUNTRY || 'Unknown';
        const region = process.env.REGION || 'Unknown';
        placeInfo = `${region}, ${country}`;
    } else {
        const placeMap = {
            'win32': 'Windows',
            'darwin': 'macOS',
            'linux': 'Linux',
            'android': 'Android'
        };
        placeInfo = `${placeMap[platform] || platform} | ${arch}`;
    }
    return placeInfo;
}

function buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo) {
    return `\u250c\u2500\u29ed FOX-CORE v${version}
\u251c\u25c6 Time: ${timeInfo.full}
\u251c\u25c6 Location: ${placeInfo}
\u251c\u25c6 Prefix: ${prefix}
\u251c\u25c6 Commands: ${context.commands?.size || 0}
\u2514\u2500\u29ed

\u250c\u2500\u29ed AI MODULES
\u251c\u2500 ${prefix}character
\u251c\u2500 ${prefix}flux
\u251c\u2500 ${prefix}foxy
\u251c\u2500 ${prefix}gpt
\u251c\u2500 ${prefix}teacher
\u251c\u2500 ${prefix}room
\u251c\u2500 ${prefix}story
\u2514\u2500\u29ed

\u250c\u2500\u29ed MEDIA HUB
\u251c\u2500 ${prefix}image
\u251c\u2500 ${prefix}instagram
\u251c\u2500 ${prefix}sticker
\u251c\u2500 ${prefix}video
\u251c\u2500 ${prefix}wallpaper
\u251c\u2500 ${prefix}ytmp4
\u251c\u2500 ${prefix}attp
\u251c\u2500 ${prefix}meme
\u251c\u2500 ${prefix}take
\u251c\u2500 ${prefix}getpp
\u251c\u2500 ${prefix}imgbb
\u251c\u2500 ${prefix}logo
\u251c\u2500 ${prefix}tosticker
\u251c\u2500 ${prefix}vv
\u2514\u2500\u29ed

\u250c\u2500\u29ed AUTO PILOT
\u251c\u2500 ${prefix}autoreact
\u251c\u2500 ${prefix}autoread
\u251c\u2500 ${prefix}autotyping
\u251c\u2500 ${prefix}autorecording
\u251c\u2500 ${prefix}autostatus
\u251c\u2500 ${prefix}autoviewstatus
\u251c\u2500 ${prefix}antidelete
\u251c\u2500 ${prefix}autorec
\u251c\u2500 ${prefix}autotype
\u2514\u2500\u29ed

\u250c\u2500\u29ed PLAYGROUND
\u251c\u2500 ${prefix}compliment
\u251c\u2500 ${prefix}debate
\u251c\u2500 ${prefix}8ball
\u251c\u2500 ${prefix}fact
\u251c\u2500 ${prefix}flip
\u251c\u2500 ${prefix}hangman
\u251c\u2500 ${prefix}hug
\u251c\u2500 ${prefix}joke
\u251c\u2500 ${prefix}quote
\u251c\u2500 ${prefix}roll
\u251c\u2500 ${prefix}tictactoe
\u251c\u2500 ${prefix}trivia
\u251c\u2500 ${prefix}slap
\u2514\u2500\u29ed

\u250c\u2500\u29ed UTILITIES
\u251c\u2500 ${prefix}menu
\u251c\u2500 ${prefix}help
\u251c\u2500 ${prefix}goodmorning
\u251c\u2500 ${prefix}status
\u251c\u2500 ${prefix}uptime
\u251c\u2500 ${prefix}warn
\u251c\u2500 ${prefix}bible
\u251c\u2500 ${prefix}quran
\u251c\u2500 ${prefix}wiki
\u251c\u2500 ${prefix}lyrics
\u251c\u2500 ${prefix}ping
\u251c\u2500 ${prefix}time
\u251c\u2500 ${prefix}timer
\u251c\u2500 ${prefix}translate
\u251c\u2500 ${prefix}tts
\u251c\u2500 ${prefix}weather
\u2514\u2500\u29ed

\u250c\u2500\u29ed GROUP OPS
\u251c\u2500 ${prefix}add
\u251c\u2500 ${prefix}antilink
\u251c\u2500 ${prefix}demote
\u251c\u2500 ${prefix}goodbye
\u251c\u2500 ${prefix}groupinfo
\u251c\u2500 ${prefix}group
\u251c\u2500 ${prefix}hidetag
\u251c\u2500 ${prefix}kick
\u251c\u2500 ${prefix}listadmins
\u251c\u2500 ${prefix}mute
\u251c\u2500 ${prefix}poll
\u251c\u2500 ${prefix}promote
\u251c\u2500 ${prefix}rules
\u251c\u2500 ${prefix}setdesc
\u251c\u2500 ${prefix}setname
\u251c\u2500 ${prefix}tagall
\u251c\u2500 ${prefix}togstatus
\u2514\u2500\u29ed

\u250c\u2500\u29ed TOOLKIT
\u251c\u2500 ${prefix}play
\u251c\u2500 ${prefix}calc
\u251c\u2500 ${prefix}logo
\u251c\u2500 ${prefix}setpp
\u251c\u2500 ${prefix}stopwatch
\u251c\u2500 ${prefix}story
\u2514\u2500\u29ed`;
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
        const botName = context?.BOT_NAME || 'Foxy Bot';
        const version = '2.0.0';
        const menuStyle = getCurrentMenuStyle();
        const timeInfo = getCurrentDateTime();
        const placeInfo = getPlaceInfo();

        const categories = {
            'ai': ['character', 'flux', 'foxy', 'gpt', 'teacher', 'room', 'story'],
            'media': ['image', 'instagram', 'sticker', 'video', 'wallpaper', 'ytmp4', 'attp', 'meme', 'take', 'getpp', 'imgbb', 'logo', 'tosticker', 'vv'],
            'automation': ['autoreact', 'autoread', 'autotyping', 'autorecording', 'autostatus', 'autoviewstatus', 'antidelete', 'autorec', 'autotype'],
            'fun': ['compliment', 'debate', '8ball', 'fact', 'flip', 'hangman', 'hug', 'joke', 'quote', 'roll', 'tictactoe', 'trivia', 'slap'],
            'general': ['menu', 'help', 'goodmorning', 'status', 'uptime', 'warn', 'bible', 'quran', 'wiki', 'lyrics', 'ping', 'time', 'timer', 'translate', 'tts', 'weather'],
            'group': ['add', 'antilink', 'demote', 'goodbye', 'groupinfo', 'group', 'hidetag', 'kick', 'listadmins', 'mute', 'poll', 'promote', 'rules', 'setdesc', 'setname', 'tagall', 'togstatus'],
            'tools': ['play', 'calc', 'logo', 'setpp', 'stopwatch', 'story'],
            'system': ['setprefix', 'mode']
        };

        if (args[0] && args[0].toLowerCase() !== 'image') {
            const category = args[0].toLowerCase();
            if (categories[category]) {
                const categoryCommands = categories[category];
                const categoryMenu = `\u250c\u2500\u29ed FOX-CORE v${version}
\u251c\u25c6 Category: ${category.toUpperCase()}
\u251c\u25c6 Prefix: ${prefix}
\u2514\u2500\u29ed

\u250c\u2500\u29ed ${category.toUpperCase()} COMMANDS
${categoryCommands.map(cmd => {
    if (category === 'system' && !isOwner) return '';
    return `\u251c\u2500 ${prefix}${cmd}`;
}).filter(cmd => cmd).join('\n')}
\u2514\u2500\u29ed

Commands: ${categoryCommands.length} | Use ${prefix}menu for full menu`;

                await sock.sendMessage(chatId, { text: categoryMenu }, { quoted: msg });
                return;
            }
        }

        try {
            console.log(`[MENU] Command from: ${chatId} | Style: ${menuStyle}`);
            const caption = buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo);

            switch(menuStyle) {
                case 1: {
                    await this.sendImageMenu(sock, chatId, msg, caption);
                    break;
                }
                case 4: {
                    await this.sendImageMenu(sock, chatId, msg, caption);
                    break;
                }
                default: {
                    await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
                    break;
                }
            }

            console.log("Menu sent successfully");
        } catch (error) {
            console.error("[MENU] ERROR:", error);
            const fallback = buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo);
            await sock.sendMessage(chatId, { text: fallback }, { quoted: msg });
        }
    },

    async sendImageMenu(sock, chatId, msg, caption) {
        try {
            const imgPath1 = path.join(__dirname, 'media', 'foxybot.jpg');
            const imgPath2 = path.join(__dirname, '../media', 'foxybot.jpg');
            const fallbackPath = path.join(__dirname, 'media', 'leonbot.jpg');

            let imagePath = null;
            if (fs.existsSync(imgPath1)) imagePath = imgPath1;
            else if (fs.existsSync(imgPath2)) imagePath = imgPath2;
            else if (fs.existsSync(fallbackPath)) imagePath = fallbackPath;

            if (imagePath) {
                const buffer = fs.readFileSync(imagePath);
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: caption,
                    mimetype: "image/jpeg"
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
            }
        } catch (error) {
            console.error("Image menu error:", error);
            throw error;
        }
    }
};
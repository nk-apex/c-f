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

function buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo, isOwner) {
    return `┌─⧭ FOX-CORE v${version}
├◆ Time: ${timeInfo.full}
├◆ Location: ${placeInfo}
├◆ Commands: ${context.commands?.size || 0}
└─⧭

┌─⧭ AI MODULES
├─ character
├─ flux
├─ foxy
├─ gpt
├─ teacher
├─ room
├─ story
└─⧭

┌─⧭ MEDIA HUB
├─ image
├─ instagram
├─ sticker
├─ video
├─ wallpaper
├─ ytmp4
├─ attp
├─ meme
├─ take
├─ getpp
├─ imgbb
├─ logo
├─ tosticker
├─ vv
└─⧭

┌─⧭ AUTO PILOT
├─ autoreact
├─ autoread
├─ autotyping
├─ autorecording
├─ autostatus
├─ autoviewstatus
├─ antidelete
├─ autorec
├─ autotype
└─⧭

┌─⧭ PLAYGROUND
├─ compliment
├─ debate
├─ 8ball
├─ fact
├─ flip
├─ hangman
├─ hug
├─ joke
├─ quote
├─ roll
├─ tictactoe
├─ trivia
├─ slap
└─⧭

┌─⧭ UTILITIES
├─ menu
├─ help
├─ goodmorning
├─ status
├─ uptime
├─ warn
├─ bible
├─ quran
├─ wiki
├─ lyrics
├─ ping
├─ time
├─ timer
├─ translate
├─ tts
├─ weather
└─⧭

┌─⧭ GROUP OPS
├─ add
├─ antilink
├─ demote
├─ goodbye
├─ groupinfo
├─ group
├─ hidetag
├─ kick
├─ listadmins
├─ mute
├─ poll
├─ promote
├─ rules
├─ setdesc
├─ setname
├─ tagall
├─ togstatus
└─⧭

┌─⧭ TOOLKIT
├─ play
├─ calc
├─ logo
├─ setpp
├─ stopwatch
├─ story
└─⧭

┌─⧭ SYSTEM
${isOwner ? 
`├─ setprefix
├─ mode` : 
'├─ [OWNER PANEL]'}
└─⧭

┌─⧭ INFO
├◆ Version: ${version}
├◆ Help: ${prefix}help [command]
└─⧭`;
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
                const categoryMenu = `┌─⧭ FOX-CORE v${version}
├◆ Category: ${category.toUpperCase()}
├◆ Prefix: ${prefix}
└─⧭

┌─⧭ ${category.toUpperCase()} COMMANDS
${categoryCommands.map(cmd => {
    if (category === 'system' && !isOwner) return '';
    return `├─ ${cmd}`;
}).filter(cmd => cmd).join('\n')}
└─⧭

┌─⧭ INFO
├◆ Commands: ${categoryCommands.length}
├◆ Full menu: ${prefix}menu
└─⧭`;

                await sock.sendMessage(chatId, { text: categoryMenu }, { quoted: msg });
                return;
            }
        }

        try {
            console.log(`[MENU] Command from: ${chatId} | Style: ${menuStyle}`);
            const caption = buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo, isOwner);

            switch(menuStyle) {
                case 1:
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
            const fallback = buildFoxCoreCaption(prefix, version, context, timeInfo, placeInfo, isOwner);
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
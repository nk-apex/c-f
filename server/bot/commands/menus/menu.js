// commands/general/menu.js - UPDATED WITH TIME & PLACE DISPLAY
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getCurrentMenuStyle } from './menustyle.js';

// Function to get current date and time with emojis
function getCurrentDateTime() {
    const now = new Date();
    
    // Time formatting
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    // Date formatting
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    
    // Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneShort = timezone.split('/').pop() || timezone;
    
    return {
        time: `🕐 ${formattedHours}:${minutes} ${ampm}`,
        date: `📅 ${dayName}, ${monthName} ${date}, ${year}`,
        timezone: `🌍 ${timezoneShort}`,
        full: `🕐 ${formattedHours}:${minutes} ${ampm} | 📅 ${dayName}, ${monthName} ${date}, ${year} | 🌍 ${timezoneShort}`
    };
}

// Function to get place/location info
function getPlaceInfo() {
    // Try to get location from system
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    
    // Format place/location info
    let placeInfo = '';
    
    if (process.env.COUNTRY || process.env.REGION) {
        const country = process.env.COUNTRY || 'Unknown';
        const region = process.env.REGION || 'Unknown';
        placeInfo = `📍 ${region}, ${country}`;
    } else {
        // Fallback to system info
        const placeMap = {
            'win32': 'Windows',
            'darwin': 'macOS',
            'linux': 'Linux',
            'android': 'Android'
        };
        placeInfo = `🖥️ ${placeMap[platform] || platform} | ${arch}`;
    }
    
    return placeInfo;
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
        
        const botName = context?.BOT_NAME || '🦊 ▂▄▅▆▇█F͚O͚X͚Y͚█▇▆▅▄▂ 🦊';
        const version = '2.0.0';
        
        const menuStyle = getCurrentMenuStyle();
        
        // Get current time and place
        const timeInfo = getCurrentDateTime();
        const placeInfo = getPlaceInfo();
        
        // ====== UPDATED WITH YOUR ACTUAL COMMANDS ======
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
        
        // Check for category argument
        if (args[0] && args[0].toLowerCase() !== 'image') {
            const category = args[0].toLowerCase();
            
            if (categories[category]) {
                const categoryCommands = categories[category];
                
                const categoryMenu = `
╔══════════════════════════════════════╗
║  🦊 ${botName.toUpperCase()} v${version}  ║
║     📂 ${category.toUpperCase()} COMMANDS     ║
╚══════════════════════════════════════╝

${categoryCommands.map(cmd => {
    if (category === 'system' && !isOwner) return '';
    return `• ${prefix}${cmd}`;
}).filter(cmd => cmd).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Commands: ${categoryCommands.length}
💬 Prefix: "${prefix}"
🎛️ Mode: ${global.BOT_MODE || 'public'}
🎨 Style: ${menuStyle}/7

💡 Use ${prefix}menu for full menu
                `.trim();
                
                await sock.sendMessage(chatId, { text: categoryMenu }, { quoted: msg });
                return;
            }
        }
        
        try {
            console.log(`🦊 [MENU] Command from: ${chatId} | Style: ${menuStyle}`);
            
            switch(menuStyle) {
                case 1: {
                    await this.sendFoxImageMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    break;
                }
                case 2: {
                    const text = this.generateMinimalistMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    break;
                }
                case 3: {
                    const text = this.generateGridMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    break;
                }
                case 4: {
                    await this.sendStatsImageMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    break;
                }
                case 5: {
                    const text = this.generateBadgeMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    break;
                }
                case 6: {
                    await this.sendCategoryPanelsMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    break;
                }
                case 7: {
                    await this.sendCardsMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    break;
                }
                default: {
                    const text = this.generateDefaultMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo);
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    break;
                }
            }
            
            console.log("✅ Menu sent successfully");
            
        } catch (error) {
            console.error("❌ [MENU] ERROR:", error);
            const fallbackMenu = this.generateFallbackMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo);
            await sock.sendMessage(chatId, { text: fallbackMenu }, { quoted: msg });
        }
    },
    
    // ========== UPDATED MENU GENERATORS WITH TIME & PLACE ==========
    
    async sendFoxImageMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        try {
            // Try to find image
            const imgPath1 = path.join(__dirname, 'media', 'foxybot.jpg');
            const imgPath2 = path.join(__dirname, '../media', 'foxybot.jpg');
            const fallbackPath = path.join(__dirname, 'media', 'leonbot.jpg');
            
            let imagePath = null;
            if (fs.existsSync(imgPath1)) imagePath = imgPath1;
            else if (fs.existsSync(imgPath2)) imagePath = imgPath2;
            else if (fs.existsSync(fallbackPath)) imagePath = fallbackPath;
            
            const caption = `🦊━━━━━━━━━━━━━━━━━━🦊
        *${botName.toUpperCase()} COMMAND CENTER*
🦊━━━━━━━━━━━━━━━━━━🦊

${timeInfo.full}
${placeInfo}

━━━━━━━━━━━━━━━━━━━━━━

⚜️ *AI COMMANDS*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ 🤖 ${prefix}character
┣⊱ ⚡ ${prefix}flux
┣⊱ 🦊 ${prefix}foxy
┣⊱ 🧠 ${prefix}gpt
┣⊱ 👨‍🏫 ${prefix}teacher
┣⊱ 🏠 ${prefix}room
┣⊱ 📖 ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *MEDIA & DOWNLOAD*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ 🖼️ ${prefix}image
┣⊱ 📷 ${prefix}instagram
┣⊱ 🏷️ ${prefix}sticker
┣⊱ 🎥 ${prefix}video
┣⊱ 🖼️ ${prefix}wallpaper
┣⊱ 📥 ${prefix}ytmp4
┣⊱ ✨ ${prefix}attp
┣⊱ 😂 ${prefix}meme
┣⊱ 🎯 ${prefix}take
┣⊱ 📸 ${prefix}getpp
┣⊱ ☁️ ${prefix}imgbb
┣⊱ 🎨 ${prefix}logo
┣⊱ 🤹 ${prefix}tosticker
┣⊱ ▶️ ${prefix}vv
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *AUTOMATION*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ ⚡ ${prefix}autoreact
┣⊱ 👁️ ${prefix}autoread
┣⊱ ⌨️ ${prefix}autotyping
┣⊱ ⏺️ ${prefix}autorecording
┣⊱ 📱 ${prefix}autostatus
┣⊱ 👁️ ${prefix}autoviewstatus
┣⊱ 🚫 ${prefix}antidelete
┣⊱ ⏺️ ${prefix}autorec
┣⊱ ⌨️ ${prefix}autotype
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *FUN & GAMES*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ 💖 ${prefix}compliment
┣⊱ 💬 ${prefix}debate
┣⊱ 🎱 ${prefix}8ball
┣⊱ 💡 ${prefix}fact
┣⊱ 🪙 ${prefix}flip
┣⊱ 🪢 ${prefix}hangman
┣⊱ 🤗 ${prefix}hug
┣⊱ 😄 ${prefix}joke
┣⊱ 💬 ${prefix}quote
┣⊱ 🎲 ${prefix}roll
┣⊱ ❌ ${prefix}tictactoe
┣⊱ 🧠 ${prefix}trivia
┣⊱ 👋 ${prefix}slap
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *GENERAL*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ 📋 ${prefix}menu
┣⊱ ❓ ${prefix}help
┣⊱ ☀️ ${prefix}goodmorning
┣⊱ 📊 ${prefix}status
┣⊱ ⏰ ${prefix}uptime
┣⊱ ⚠️ ${prefix}warn
┣⊱ 📖 ${prefix}bible
┣⊱ 🕋 ${prefix}quran
┣⊱ 📚 ${prefix}wiki
┣⊱ 🎵 ${prefix}lyrics
┣⊱ ⚡ ${prefix}ping
┣⊱ ⏰ ${prefix}time
┣⊱ ⏱️ ${prefix}timer
┣⊱ 🌍 ${prefix}translate
┣⊱ 🔊 ${prefix}tts
┣⊱ 🌤️ ${prefix}weather
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *GROUP MANAGEMENT*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ ➕ ${prefix}add
┣⊱ 🔗 ${prefix}antilink
┣⊱ ⬇️ ${prefix}demote
┣⊱ 👋 ${prefix}goodbye
┣⊱ 📊 ${prefix}groupinfo
┣⊱ 👥 ${prefix}group
┣⊱ 🎭 ${prefix}hidetag
┣⊱ 🚪 ${prefix}kick
┣⊱ 👑 ${prefix}listadmins
┣⊱ 🔇 ${prefix}mute
┣⊱ 📊 ${prefix}poll
┣⊱ 👑 ${prefix}promote
┣⊱ 📜 ${prefix}rules
┣⊱ 📝 ${prefix}setdesc
┣⊱ 🏷️ ${prefix}setname
┣⊱ 👥 ${prefix}tagall
┣⊱ 🔄 ${prefix}togstatus
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *TOOLS*
┣━━━━━━━━━━━━━━━━━━━━━━
┣⊱ 🎵 ${prefix}play
┣⊱ 🧮 ${prefix}calc
┣⊱ 🎨 ${prefix}logo
┣⊱ 🖼️ ${prefix}setpp
┣⊱ ⏱️ ${prefix}stopwatch
┣⊱ 📖 ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━

⚜️ *SYSTEM COMMANDS*
┣━━━━━━━━━━━━━━━━━━━━━━
${isOwner ? 
`┣⊱ 🔣 ${prefix}setprefix
┣⊱ ⚙️ ${prefix}mode` : 
'┣⊱ 👑 Owner Only'}
┗━━━━━━━━━━━━━━━━━━━━━━

🦊━━━━━━━━━━━━━━━━━━🦊
Prefix: "${prefix}"
Version: ${version}
Total: ${context.commands?.size || 0}+ commands
Style: 1/7 🦊

Type ${prefix}help <command> for details
🦊━━━━━━━━━━━━━━━━━━🦊`;
            
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
            console.error("❌ Fox image menu error:", error);
            throw error;
        }
    },
    
    generateMinimalistMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        return `╔════════════════════════════╗
           *${botName.toUpperCase()}*
╚════════════════════════════╝
${timeInfo.full}
${placeInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Style: 2/7 | Prefix: "${prefix}"

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        AI COMMANDS        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}character ${prefix}flux ${prefix}foxy
┃ ${prefix}gpt ${prefix}teacher ${prefix}room
┃ ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     MEDIA & DOWNLOAD      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}image ${prefix}instagram ${prefix}sticker
┃ ${prefix}video ${prefix}wallpaper ${prefix}ytmp4
┃ ${prefix}attp ${prefix}meme ${prefix}take
┃ ${prefix}getpp ${prefix}imgbb ${prefix}logo
┃ ${prefix}tosticker ${prefix}vv
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃       AUTOMATION          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}autoreact ${prefix}autoread
┃ ${prefix}autotyping ${prefix}autorecording
┃ ${prefix}autostatus ${prefix}autoviewstatus
┃ ${prefix}antidelete ${prefix}autorec
┃ ${prefix}autotype
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃       FUN & GAMES         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}compliment ${prefix}debate ${prefix}8ball
┃ ${prefix}fact ${prefix}flip ${prefix}hangman
┃ ${prefix}hug ${prefix}joke ${prefix}quote
┃ ${prefix}roll ${prefix}tictactoe ${prefix}trivia
┃ ${prefix}slap
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         GENERAL           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}menu ${prefix}help ${prefix}goodmorning
┃ ${prefix}status ${prefix}uptime ${prefix}warn
┃ ${prefix}bible ${prefix}quran ${prefix}wiki
┃ ${prefix}lyrics ${prefix}ping ${prefix}time
┃ ${prefix}timer ${prefix}translate ${prefix}tts
┃ ${prefix}weather
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    GROUP MANAGEMENT       ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}add ${prefix}antilink ${prefix}demote
┃ ${prefix}goodbye ${prefix}groupinfo ${prefix}group
┃ ${prefix}hidetag ${prefix}kick ${prefix}listadmins
┃ ${prefix}mute ${prefix}poll ${prefix}promote
┃ ${prefix}rules ${prefix}setdesc ${prefix}setname
┃ ${prefix}tagall ${prefix}togstatus
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          TOOLS            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}play ${prefix}calc ${prefix}logo
┃ ${prefix}setpp ${prefix}stopwatch ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     SYSTEM COMMANDS       ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${isOwner ? `${prefix}setprefix ${prefix}mode` : '👑 Owner Only'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔════════════════════════════╗
    Powered by Foxy 🦊
    v${version} | ${context.commands?.size || 0}+ commands
╚════════════════════════════╝`;
    },
    
    generateGridMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        return `┌─────────────────────────────────┐
│        🦊 ${botName.toUpperCase()} 🦊        │
├─────────────────────────────────┤
│ ${timeInfo.time} │ ${timeInfo.date}  │
│ ${placeInfo}                     │
├─────────────────────────────────┤
│         AI COMMANDS             │
├─────────────────────────────────┤
│ ${prefix}character │ ${prefix}flux   │ ${prefix}foxy
│ ${prefix}gpt      │ ${prefix}teacher│ ${prefix}room
│ ${prefix}story    │
├─────────────────────────────────┤
│       MEDIA & DOWNLOAD          │
├─────────────────────────────────┤
│ ${prefix}image     │ ${prefix}instagram│ ${prefix}sticker
│ ${prefix}video     │ ${prefix}wallpaper│ ${prefix}ytmp4
│ ${prefix}attp      │ ${prefix}meme    │ ${prefix}take
│ ${prefix}getpp     │ ${prefix}imgbb   │ ${prefix}logo
│ ${prefix}tosticker │ ${prefix}vv      │
├─────────────────────────────────┤
│         AUTOMATION              │
├─────────────────────────────────┤
│ ${prefix}autoreact │ ${prefix}autoread │ ${prefix}autotyping
│ ${prefix}autorecording │ ${prefix}autostatus│ ${prefix}autoviewstatus
│ ${prefix}antidelete│ ${prefix}autorec  │ ${prefix}autotype
├─────────────────────────────────┤
│         FUN & GAMES             │
├─────────────────────────────────┤
│ ${prefix}compliment│ ${prefix}debate  │ ${prefix}8ball
│ ${prefix}fact      │ ${prefix}flip    │ ${prefix}hangman
│ ${prefix}hug       │ ${prefix}joke    │ ${prefix}quote
│ ${prefix}roll      │ ${prefix}tictactoe│ ${prefix}trivia
│ ${prefix}slap      │
├─────────────────────────────────┤
│           GENERAL               │
├─────────────────────────────────┤
│ ${prefix}menu      │ ${prefix}help    │ ${prefix}goodmorning
│ ${prefix}status    │ ${prefix}uptime  │ ${prefix}warn
│ ${prefix}bible     │ ${prefix}quran   │ ${prefix}wiki
│ ${prefix}lyrics    │ ${prefix}ping    │ ${prefix}time
│ ${prefix}timer     │ ${prefix}translate│ ${prefix}tts
│ ${prefix}weather   │
├─────────────────────────────────┤
│      GROUP MANAGEMENT           │
├─────────────────────────────────┤
│ ${prefix}add       │ ${prefix}antilink│ ${prefix}demote
│ ${prefix}goodbye   │ ${prefix}groupinfo│ ${prefix}group
│ ${prefix}hidetag   │ ${prefix}kick    │ ${prefix}listadmins
│ ${prefix}mute      │ ${prefix}poll    │ ${prefix}promote
│ ${prefix}rules     │ ${prefix}setdesc │ ${prefix}setname
│ ${prefix}tagall    │ ${prefix}togstatus│
├─────────────────────────────────┤
│            TOOLS                │
├─────────────────────────────────┤
│ ${prefix}play      │ ${prefix}calc    │ ${prefix}logo
│ ${prefix}setpp     │ ${prefix}stopwatch│ ${prefix}story
├─────────────────────────────────┤
│           SYSTEM                │
├─────────────────────────────────┤
│ ${isOwner ? `${prefix}setprefix│ ${prefix}mode` : '👑 Owner Only'}
└─────────────────────────────────┘
         🦊 Version ${version} 🦊
         Prefix: "${prefix}"
         Style: 3/7 | Commands: ${context.commands?.size || 0}+`;
    },
    
    async sendStatsImageMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        try {
            const commandsText = `🦊━━━━━━━━━━━━━━━━━━🦊
         *${botName.toUpperCase()} COMMANDS*
🦊━━━━━━━━━━━━━━━━━━🦊

${timeInfo.full}
${placeInfo}

━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━🤖 AI━━━━━━━┓
┃ 🔹 ${prefix}character 🔹 ${prefix}flux
┃ 🔸 ${prefix}foxy      🔸 ${prefix}gpt
┃ 🔹 ${prefix}teacher   🔹 ${prefix}room
┃ 🔸 ${prefix}story     🔸
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━🎨 MEDIA━━━━━━━┓
┃ 🔹 ${prefix}image      🔹 ${prefix}instagram
┃ 🔸 ${prefix}sticker    🔸 ${prefix}video
┃ 🔹 ${prefix}wallpaper  🔹 ${prefix}ytmp4
┃ 🔸 ${prefix}attp       🔸 ${prefix}meme
┃ 🔹 ${prefix}take       🔹 ${prefix}getpp
┃ 🔸 ${prefix}imgbb      🔸 ${prefix}logo
┃ 🔹 ${prefix}tosticker  🔹 ${prefix}vv
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━⚡ AUTOMATION━━━━━━━┓
┃ 🔹 ${prefix}autoreact    🔹 ${prefix}autoread
┃ 🔸 ${prefix}autotyping   🔸 ${prefix}autorecording
┃ 🔹 ${prefix}autostatus   🔹 ${prefix}autoviewstatus
┃ 🔸 ${prefix}antidelete   🔸 ${prefix}autorec
┃ 🔹 ${prefix}autotype     🔹
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━🎮 FUN━━━━━━━┓
┃ 🔹 ${prefix}compliment 🔹 ${prefix}debate
┃ 🔸 ${prefix}8ball      🔸 ${prefix}fact
┃ 🔹 ${prefix}flip       🔹 ${prefix}hangman
┃ 🔸 ${prefix}hug        🔸 ${prefix}joke
┃ 🔹 ${prefix}quote      🔹 ${prefix}roll
┃ 🔸 ${prefix}tictactoe  🔸 ${prefix}trivia
┃ 🔹 ${prefix}slap       🔸
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━📊 GENERAL━━━━━━━┓
┃ 🔹 ${prefix}menu       🔹 ${prefix}help
┃ 🔸 ${prefix}goodmorning🔸 ${prefix}status
┃ 🔹 ${prefix}uptime     🔹 ${prefix}warn
┃ 🔸 ${prefix}bible      🔸 ${prefix}quran
┃ 🔹 ${prefix}wiki       🔹 ${prefix}lyrics
┃ 🔸 ${prefix}ping       🔸 ${prefix}time
┃ 🔹 ${prefix}timer      🔹 ${prefix}translate
┃ 🔸 ${prefix}tts        🔸 ${prefix}weather
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━👥 GROUP━━━━━━━┓
┃ 🔹 ${prefix}add       🔹 ${prefix}antilink
┃ 🔸 ${prefix}demote    🔸 ${prefix}goodbye
┃ 🔹 ${prefix}groupinfo 🔹 ${prefix}group
┃ 🔸 ${prefix}hidetag   🔸 ${prefix}kick
┃ 🔹 ${prefix}listadmins🔹 ${prefix}mute
┃ 🔸 ${prefix}poll      🔸 ${prefix}promote
┃ 🔹 ${prefix}rules     🔹 ${prefix}setdesc
┃ 🔸 ${prefix}setname   🔸 ${prefix}tagall
┃ 🔹 ${prefix}togstatus 🔸
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━🛠️ TOOLS━━━━━━━┓
┃ 🔹 ${prefix}play      🔹 ${prefix}calc
┃ 🔸 ${prefix}logo      🔸 ${prefix}setpp
┃ 🔹 ${prefix}stopwatch 🔹 ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━🔧 SYSTEM━━━━━━━┓
┃ ${isOwner ? `🔹 ${prefix}setprefix 🔹 ${prefix}mode` : '👑 Owner Only'}
┗━━━━━━━━━━━━━━━━━━━━━┛

🦊━━━━━━━━━━━━━━━━━━🦊
Total: ${context.commands?.size || 0}+ commands
Created by Foxy Bot 🦊`;
            
            // Image sending logic
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
                    caption: commandsText,
                    mimetype: "image/jpeg" 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: commandsText }, { quoted: msg });
            }
            
        } catch (error) {
            console.error("❌ Stats image menu error:", error);
            throw error;
        }
    },
    
    generateBadgeMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const mnt = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeStr = `${h}h ${mnt}m ${s}s`;
        
        return `🦊━━━━━━━━━━━━━━━━━━🦊
      *${botName.toUpperCase()} COMMAND LIST*
🦊━━━━━━━━━━━━━━━━━━🦊

${timeInfo.full}
${placeInfo}

━━━━━━━━━━━━━━━━━━━━━━

📊 BOT STATS:
👤 ${msg?.pushName || "User"}
🔣 ${prefix} | ⏱️ ${uptimeStr} | 🦊 v${version}
Style: 5/7 | Commands: ${context.commands?.size || 0}+
────────────────────

〘 AI 〙
🤖 ${prefix}character │ ⚡ ${prefix}flux │ 🦊 ${prefix}foxy
🧠 ${prefix}gpt │ 👨‍🏫 ${prefix}teacher │ 🏠 ${prefix}room
📖 ${prefix}story │

〘 MEDIA 〙
🖼️ ${prefix}image │ 📷 ${prefix}instagram │ 🏷️ ${prefix}sticker
🎥 ${prefix}video │ 🖼️ ${prefix}wallpaper │ 📥 ${prefix}ytmp4
✨ ${prefix}attp │ 😂 ${prefix}meme │ 🎯 ${prefix}take
📸 ${prefix}getpp │ ☁️ ${prefix}imgbb │ 🎨 ${prefix}logo
🤹 ${prefix}tosticker │ ▶️ ${prefix}vv │

〘 AUTOMATION 〙
⚡ ${prefix}autoreact │ 👁️ ${prefix}autoread │ ⌨️ ${prefix}autotyping
⏺️ ${prefix}autorecording │ 📱 ${prefix}autostatus │ 👁️ ${prefix}autoviewstatus
🚫 ${prefix}antidelete │ ⏺️ ${prefix}autorec │ ⌨️ ${prefix}autotype

〘 FUN & GAMES 〙
💖 ${prefix}compliment │ 💬 ${prefix}debate │ 🎱 ${prefix}8ball
💡 ${prefix}fact │ 🪙 ${prefix}flip │ 🪢 ${prefix}hangman
🤗 ${prefix}hug │ 😄 ${prefix}joke │ 💬 ${prefix}quote
🎲 ${prefix}roll │ ❌ ${prefix}tictactoe │ 🧠 ${prefix}trivia
👋 ${prefix}slap │

〘 GENERAL 〙
📋 ${prefix}menu │ ❓ ${prefix}help │ ☀️ ${prefix}goodmorning
📊 ${prefix}status │ ⏰ ${prefix}uptime │ ⚠️ ${prefix}warn
📖 ${prefix}bible │ 🕋 ${prefix}quran │ 📚 ${prefix}wiki
🎵 ${prefix}lyrics │ ⚡ ${prefix}ping │ ⏰ ${prefix}time
⏱️ ${prefix}timer │ 🌍 ${prefix}translate │ 🔊 ${prefix}tts
🌤️ ${prefix}weather │

〘 GROUP 〙
➕ ${prefix}add │ 🔗 ${prefix}antilink │ ⬇️ ${prefix}demote
👋 ${prefix}goodbye │ 📊 ${prefix}groupinfo │ 👥 ${prefix}group
🎭 ${prefix}hidetag │ 🚪 ${prefix}kick │ 👑 ${prefix}listadmins
🔇 ${prefix}mute │ 📊 ${prefix}poll │ 👑 ${prefix}promote
📜 ${prefix}rules │ 📝 ${prefix}setdesc │ 🏷️ ${prefix}setname
👥 ${prefix}tagall │ 🔄 ${prefix}togstatus │

〘 TOOLS 〙
🎵 ${prefix}play │ 🧮 ${prefix}calc │ 🎨 ${prefix}logo
🖼️ ${prefix}setpp │ ⏱️ ${prefix}stopwatch │ 📖 ${prefix}story

〘 SYSTEM 〙
${isOwner ? `🔣 ${prefix}setprefix │ ⚙️ ${prefix}mode` : '👑 Owner Only'}

🦊━━━━━━━━━━━━━━━━━━🦊
Created by Foxy Bot 🦊 | Total: ${context.commands?.size || 0}+ commands`;
    },
    
    async sendCategoryPanelsMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        const text = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
      🦊 ${botName.toUpperCase()} MENU 🦊
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     TIME & LOCATION       ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${timeInfo.time} ${timeInfo.date}
┃ ${placeInfo}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        🤖 AI PANEL        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}character ${prefix}flux ${prefix}foxy
┃ ${prefix}gpt ${prefix}teacher ${prefix}room
┃ ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🎨 MEDIA PANEL        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}image ${prefix}instagram ${prefix}sticker
┃ ${prefix}video ${prefix}wallpaper ${prefix}ytmp4
┃ ${prefix}attp ${prefix}meme ${prefix}take
┃ ${prefix}getpp ${prefix}imgbb ${prefix}logo
┃ ${prefix}tosticker ${prefix}vv
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     ⚡ AUTOMATION PANEL   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}autoreact ${prefix}autoread
┃ ${prefix}autotyping ${prefix}autorecording
┃ ${prefix}autostatus ${prefix}autoviewstatus
┃ ${prefix}antidelete ${prefix}autorec
┃ ${prefix}autotype
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🎮 FUN & GAMES PANEL  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}compliment ${prefix}debate ${prefix}8ball
┃ ${prefix}fact ${prefix}flip ${prefix}hangman
┃ ${prefix}hug ${prefix}joke ${prefix}quote
┃ ${prefix}roll ${prefix}tictactoe ${prefix}trivia
┃ ${prefix}slap
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     📊 GENERAL PANEL      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}menu ${prefix}help ${prefix}goodmorning
┃ ${prefix}status ${prefix}uptime ${prefix}warn
┃ ${prefix}bible ${prefix}quran ${prefix}wiki
┃ ${prefix}lyrics ${prefix}ping ${prefix}time
┃ ${prefix}timer ${prefix}translate ${prefix}tts
┃ ${prefix}weather
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     👥 GROUP PANEL        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}add ${prefix}antilink ${prefix}demote
┃ ${prefix}goodbye ${prefix}groupinfo ${prefix}group
┃ ${prefix}hidetag ${prefix}kick ${prefix}listadmins
┃ ${prefix}mute ${prefix}poll ${prefix}promote
┃ ${prefix}rules ${prefix}setdesc ${prefix}setname
┃ ${prefix}tagall ${prefix}togstatus
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🛠️ TOOLS PANEL        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${prefix}play ${prefix}calc ${prefix}logo
┃ ${prefix}setpp ${prefix}stopwatch ${prefix}story
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🔧 SYSTEM PANEL       ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ${isOwner ? `${prefix}setprefix ${prefix}mode` : '👑 Owner Only'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         BOT INFO          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🦊 Version: ${version}
┃ 🔣 Prefix: "${prefix}"
┃ 📊 Commands: ${context.commands?.size || 0}
┃ 🎨 Style: 6/7
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        
        await sock.sendMessage(chatId, { text }, { quoted: msg });
    },
    
    async sendCardsMenu(sock, chatId, msg, prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        const text = `┌─────────────────────────────────┐
│        COMMAND CARDS MENU        │
├─────────────────────────────────┤
│  🕐 ${timeInfo.time} | 📅 ${timeInfo.date}  │
│  ${placeInfo}                     │
├─────────────────────────────────┤
│  🤖 AI CARD                     │
│  • ${prefix}character • ${prefix}flux    │
│  • ${prefix}foxy • ${prefix}gpt • ${prefix}teacher│
│  • ${prefix}room • ${prefix}story               │
├─────────────────────────────────┤
│  🎨 MEDIA CARD                  │
│  • ${prefix}image • ${prefix}instagram • ${prefix}sticker│
│  • ${prefix}video • ${prefix}wallpaper • ${prefix}ytmp4│
│  • ${prefix}attp • ${prefix}meme • ${prefix}take  │
│  • ${prefix}getpp • ${prefix}imgbb • ${prefix}logo│
│  • ${prefix}tosticker • ${prefix}vv              │
├─────────────────────────────────┤
│  ⚡ AUTOMATION CARD             │
│  • ${prefix}autoreact • ${prefix}autoread        │
│  • ${prefix}autotyping • ${prefix}autorecording  │
│  • ${prefix}autostatus • ${prefix}autoviewstatus │
│  • ${prefix}antidelete • ${prefix}autorec        │
│  • ${prefix}autotype                            │
├─────────────────────────────────┤
│  🎮 FUN & GAMES CARD            │
│  • ${prefix}compliment • ${prefix}debate         │
│  • ${prefix}8ball • ${prefix}fact • ${prefix}flip│
│  • ${prefix}hangman • ${prefix}hug • ${prefix}joke│
│  • ${prefix}quote • ${prefix}roll • ${prefix}tictactoe│
│  • ${prefix}trivia • ${prefix}slap               │
├─────────────────────────────────┤
│  📊 GENERAL CARD                │
│  • ${prefix}menu • ${prefix}help • ${prefix}goodmorning│
│  • ${prefix}status • ${prefix}uptime • ${prefix}warn│
│  • ${prefix}bible • ${prefix}quran • ${prefix}wiki│
│  • ${prefix}lyrics • ${prefix}ping • ${prefix}time│
│  • ${prefix}timer • ${prefix}translate • ${prefix}tts│
│  • ${prefix}weather                             │
├─────────────────────────────────┤
│  👥 GROUP CARD                  │
│  • ${prefix}add • ${prefix}antilink • ${prefix}demote│
│  • ${prefix}goodbye • ${prefix}groupinfo • ${prefix}group│
│  • ${prefix}hidetag • ${prefix}kick • ${prefix}listadmins│
│  • ${prefix}mute • ${prefix}poll • ${prefix}promote│
│  • ${prefix}rules • ${prefix}setdesc • ${prefix}setname│
│  • ${prefix}tagall • ${prefix}togstatus          │
├─────────────────────────────────┤
│  🛠️ TOOLS CARD                  │
│  • ${prefix}play • ${prefix}calc • ${prefix}logo │
│  • ${prefix}setpp • ${prefix}stopwatch • ${prefix}story│
├─────────────────────────────────┤
│  🔧 SYSTEM CARD                 │
│  ${isOwner ? `• ${prefix}setprefix • ${prefix}mode` : '• 👑 Owner Only'}
├─────────────────────────────────┤
│          BOT STATS              │
│  🦊 ${botName} v${version}           │
│  🔣 Prefix: "${prefix}"           │
│  📊 Total: ${context.commands?.size || 0} commands │
│  🎨 Style: 7/7                   │
└─────────────────────────────────┘`;
        
        await sock.sendMessage(chatId, { text }, { quoted: msg });
    },
    
    generateDefaultMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        return `
╔══════════════════════════════════════╗
║         🦊 ${botName.toUpperCase()} v${version}         ║
║          Foxy Bot 🦊                 ║
╚══════════════════════════════════════╝

${timeInfo.full}
${placeInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *BOT INFORMATION*
• Prefix: "${prefix}"
• Mode: ${global.BOT_MODE || 'public'}
• Status: 🦊 Online & Ready
• Commands: ${context.commands?.size || 0} loaded
• Style: Default

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *AI COMMANDS* (7)
• ${prefix}character • ${prefix}flux • ${prefix}foxy
• ${prefix}gpt • ${prefix}teacher • ${prefix}room
• ${prefix}story

🎨 *MEDIA & DOWNLOAD* (13)
• ${prefix}image • ${prefix}instagram • ${prefix}sticker
• ${prefix}video • ${prefix}wallpaper • ${prefix}ytmp4
• ${prefix}attp • ${prefix}meme • ${prefix}take
• ${prefix}getpp • ${prefix}imgbb • ${prefix}logo
• ${prefix}tosticker • ${prefix}vv

⚡ *AUTOMATION* (9)
• ${prefix}autoreact • ${prefix}autoread • ${prefix}autotyping
• ${prefix}autorecording • ${prefix}autostatus • ${prefix}autoviewstatus
• ${prefix}antidelete • ${prefix}autorec • ${prefix}autotype

🎮 *FUN & GAMES* (13)
• ${prefix}compliment • ${prefix}debate • ${prefix}8ball
• ${prefix}fact • ${prefix}flip • ${prefix}hangman
• ${prefix}hug • ${prefix}joke • ${prefix}quote
• ${prefix}roll • ${prefix}tictactoe • ${prefix}trivia
• ${prefix}slap

📊 *GENERAL* (16)
• ${prefix}menu • ${prefix}help • ${prefix}goodmorning
• ${prefix}status • ${prefix}uptime • ${prefix}warn
• ${prefix}bible • ${prefix}quran • ${prefix}wiki
• ${prefix}lyrics • ${prefix}ping • ${prefix}time
• ${prefix}timer • ${prefix}translate • ${prefix}tts
• ${prefix}weather

👥 *GROUP MANAGEMENT* (16)
• ${prefix}add • ${prefix}antilink • ${prefix}demote
• ${prefix}goodbye • ${prefix}groupinfo • ${prefix}group
• ${prefix}hidetag • ${prefix}kick • ${prefix}listadmins
• ${prefix}mute • ${prefix}poll • ${prefix}promote
• ${prefix}rules • ${prefix}setdesc • ${prefix}setname
• ${prefix}tagall • ${prefix}togstatus

🛠️ *TOOLS* (6)
• ${prefix}play • ${prefix}calc • ${prefix}logo
• ${prefix}setpp • ${prefix}stopwatch • ${prefix}story

🔧 *SYSTEM COMMANDS* ${isOwner ? '(2)' : '(Owner Only)'}
${isOwner ? `
• ${prefix}setprefix • ${prefix}mode
` : '• (Owner commands hidden)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 *TOTAL COMMANDS:* ${context.commands?.size || 0}
💡 *Usage:* ${prefix}menu [category]
🔍 *Examples:*
• ${prefix}menu ai • ${prefix}menu media
• ${prefix}menu group • ${prefix}menu fun

🦊 *Foxy Bot - Your WhatsApp Assistant*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
    },
    
    generateFallbackMenu(prefix, botName, version, isOwner, context, timeInfo, placeInfo) {
        return `
🦊 *${botName} MENU* v${version}
${timeInfo.full}
${placeInfo}

Prefix: "${prefix}" | Total: ${context.commands?.size || 0} commands

🤖 *AI:* ${prefix}character ${prefix}flux ${prefix}foxy ${prefix}gpt ${prefix}teacher ${prefix}room ${prefix}story

🎨 *MEDIA:* ${prefix}image ${prefix}instagram ${prefix}sticker ${prefix}video ${prefix}wallpaper ${prefix}ytmp4 ${prefix}attp ${prefix}meme ${prefix}take ${prefix}getpp ${prefix}imgbb ${prefix}logo ${prefix}tosticker ${prefix}vv

⚡ *AUTOMATION:* ${prefix}autoreact ${prefix}autoread ${prefix}autotyping ${prefix}autorecording ${prefix}autostatus ${prefix}autoviewstatus ${prefix}antidelete ${prefix}autorec ${prefix}autotype

🎮 *FUN & GAMES:* ${prefix}compliment ${prefix}debate ${prefix}8ball ${prefix}fact ${prefix}flip ${prefix}hangman ${prefix}hug ${prefix}joke ${prefix}quote ${prefix}roll ${prefix}tictactoe ${prefix}trivia ${prefix}slap

📊 *GENERAL:* ${prefix}menu ${prefix}help ${prefix}goodmorning ${prefix}status ${prefix}uptime ${prefix}warn ${prefix}bible ${prefix}quran ${prefix}wiki ${prefix}lyrics ${prefix}ping ${prefix}time ${prefix}timer ${prefix}translate ${prefix}tts ${prefix}weather

👥 *GROUP:* ${prefix}add ${prefix}antilink ${prefix}demote ${prefix}goodbye ${prefix}groupinfo ${prefix}group ${prefix}hidetag ${prefix}kick ${prefix}listadmins ${prefix}mute ${prefix}poll ${prefix}promote ${prefix}rules ${prefix}setdesc ${prefix}setname ${prefix}tagall ${prefix}togstatus

🛠️ *TOOLS:* ${prefix}play ${prefix}calc ${prefix}logo ${prefix}setpp ${prefix}stopwatch ${prefix}story

🔧 *SYSTEM:* ${isOwner ? `${prefix}setprefix ${prefix}mode` : 'Owner Only'}

🦊 *Foxy Bot* | Use ${prefix}foxymenu for this menu
            `.trim();
    }
};
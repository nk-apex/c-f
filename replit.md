# Foxy Bot - WhatsApp Bot (Console)

## Overview

Foxy Bot is a WhatsApp bot that runs entirely in the terminal/console. It connects to WhatsApp using the Baileys library with two authentication methods: **pair code** (phone number → 8-digit code from WhatsApp) or **session ID** (FOXY:~<base64> format). The bot has 263 commands across 25 categories.

## User Preferences

Preferred communication style: Simple, everyday language.
No web dashboard - everything runs in the console/terminal.
Orange-themed console output with box-drawing borders (┌─⧭ style).
Files use plain JavaScript (.js extension), run via tsx.

## System Architecture

### Console Application (server/index.js)
- Pure terminal-based bot with readline prompts
- Connection menu: pair code or session ID
- Console commands: status, config, commands, restart, stop, exit, help
- Orange-themed ANSI color output with ┌─⧭ borders
- Incoming messages displayed with real phone numbers, group/DM/owner labels
- Minimal HTTP server on port 5000 (required by Replit, shows plain text status)
- Sends FOX-CORE ONLINE success message to WhatsApp on connection (includes prefix)
- Console.log suppressed during command loading for clean output

### Bot Engine (server/bot/)
- **Connection** (`connection.js`): WhatsApp connection via `@whiskeysockets/baileys`, supports pair code and session ID auth, reconnection with exponential backoff, session stored in `session/` directory
- **Command Loader** (`commandLoader.js`): Dynamically loads .js command files from `server/bot/commands/` organized by category directories. Exposes `getCommandsMap()` for Map access with `.size`
- **Message Handler** (`messageHandler.js`): Processes WhatsApp messages, routes commands based on prefix, enforces 5 bot modes, unwraps ephemeral/viewOnce message types, accepts console logger callback for incoming message display
- **Config**: Bot configuration in `server/bot/bot_config.json` (prefix, mode, owner number, bot name)
- **Utils** (`server/bot/utils/`): foxEconomy, foxGames, foxGroup, foxMaster, standalonePermissions
- **Handlers** (`server/bot/handlers/`): prefixHandler

### Connection Methods
1. **Pair Code**: Enter phone number (country code + digits), WhatsApp sends 8-digit code to link device
2. **Session ID**: Paste a session string in formats: FOXY:~<base64>, FOXY-BOT:<base64>, WOLF-BOT:<base64>, or plain base64
3. **Environment Variable**: Set `SESSION_ID` in .env or platform env vars for auto-connect on startup (headless deployment)
4. **Reconnect**: If a previous session exists in `session/`, can reconnect automatically

### Deployment Compatibility
- **Replit**: Runs via `npm run dev`, auto-connects with SESSION_ID env var or existing session
- **Heroku**: `Procfile` included (worker dyno), set SESSION_ID in Config Vars
- **Railway**: `railway.json` + `nixpacks.toml` included, set SESSION_ID in Variables
- **Render**: `render.yaml` included, set SESSION_ID in Environment
- **Any platform**: Set `SESSION_ID` environment variable and run `npx tsx server/index.js`
- **`.env.example`**: Reference file showing required environment variables

### Bot Modes
- public: Everyone can use the bot
- private: Owner only
- group-only: Works in groups only
- dms-only: DMs only, ignores groups

### Bot Command Structure
Commands are JavaScript files in `server/bot/commands/{category}/` folders. Each exports:
- `name`, `alias[]`, `description`, `category`, `ownerOnly`
- `execute(sock, msg, args, prefix, extra)` async function

The `extra` parameter includes:
- `commands`: Map of all loaded commands (supports `.size`)
- `isOwner`: boolean
- `BOT_NAME`: string
- `jidManager`: JID utilities
- `prefixHandler`: prefix get/set utilities

### Menu Format (FOX-CORE)
Menu uses ┌─⧭ box-drawing style with sections: FOX-CORE header, AI MODULES, MEDIA HUB, AUTO PILOT, PLAYGROUND, UTILITIES, GROUP OPS, TOOLKIT, SYSTEM, INFO.

### Ephoto 360 Commands (server/bot/commands/ephoto/)
- **ephoto.js**: Master command - `ephoto <id> <text>` - Lists all 59 effects (neon + 3D)
- **19 Neon effect commands**: neontext, colorfulglow, advancedglow, neononline, blueneon, neonlight, neonlighttext, greenneon, greenneonlight, blueneonlogo, galaxyneon, retroneon, neonsign, hackerneon, devilwings, glowtext, blackpink, neonglitch, colorfulneon
- **40 3D effect commands**: wooden3d, cubic3d, woodentext3d, water3d, cuongthi, 3dtexteffect, graffiti3d, silver3d, 3dstyle, metal3d, ruby3d, birthday3d, metallogo, cute3d, avengers3d, hologram, gradient3d, stone3d, space3d, sand3d, gradienttext3d, lightbulb3d, snow3d, papercut3d, underwater3d, shinymetallic, gradient3dtext, beach3d, crack3d, wood3d, americanflag, sparkles3d, nigeriaflag, christmassnow, goldenglitter, decorativemetal, paint3d, glossysilver, balloon3d, comic3d
- Each command: `<command> <text>` to generate effect
- API: `https://apis.xwolf.space/api/ephoto-360/generate?effectId=ID&text=TEXT`

### Download APIs (xwolf)
- Search: `https://apis.xwolf.space/api/search?q=QUERY` → {items: [{title, id, size, duration}]}
- YT MP3: `https://apis.xwolf.space/download/ytmp3?url=URL` → {downloadUrl, title, streamUrl}
- DL MP3: `https://apis.xwolf.space/download/dlmp3?url=URL` → same as ytmp3
- MP4: `https://apis.xwolf.space/download/mp4?url=URL` → {downloadUrl, title} (slower, 60s timeout)

### Owner Commands (server/bot/commands/owner/)
Core Management: setbotname, resetbotname, setowner, resetowner, iamowner, about, owner, block, unblock, blockdetect, silent, anticall, mode, setfooter, repo, pair, antidelete, antideletestatus, antiedit, chatbot, shutdown
System & Maintenance: restart, workingreload, reloadenv, getsettings, setsetting, test, disk, hostip, findcommands, latestupdates, panel, debugchat
Privacy Controls: online, privacy, receipt, profilepic, viewer

### Data Storage
- **Bot Config**: JSON file at `server/bot/bot_config.json` (prefix, mode, ownerNumber, botName, plus toggle flags: antidelete, antiedit, anticall, chatbot, readReceipts, autoStatusView, footer)
- **Auth Session**: Filesystem at `session/` directory using Baileys' `useMultiFileAuthState`
- **No database required** for core functionality

## External Dependencies

### Core
- **@whiskeysockets/baileys**: WhatsApp Web multi-device protocol
- **axios**: HTTP client for command APIs
- **canvas**: Image/text generation for text commands
- **node-fetch**: HTTP requests
- **node-webpmux**: WebP sticker manipulation
- **fluent-ffmpeg** + **ffmpeg-static**: Audio/video processing
- **yt-search**: YouTube search
- **acrcloud**: Audio recognition (Shazam command)

### Build
- **tsx**: JavaScript/TypeScript execution
- **typescript**: Type checking (LSP only, not used at runtime)

## Running
- `npm run dev` starts the console bot via `tsx server/index.js`
- The bot prompts for connection method in the terminal
- Type `help` for available console commands while running
- Incoming messages appear in orange-bordered boxes with sender info

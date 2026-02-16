# Foxy Bot - WhatsApp Bot (Console)

## Overview

Foxy Bot is a WhatsApp bot that runs entirely in the terminal/console. It connects to WhatsApp using the Baileys library with two authentication methods: **pair code** (phone number → 8-digit code from WhatsApp) or **session ID** (FOXY:~<base64> format). The bot has 119+ commands across 23 categories.

## User Preferences

Preferred communication style: Simple, everyday language.
No web dashboard - everything runs in the console/terminal.

## System Architecture

### Console Application (server/index.ts)
- Pure terminal-based bot with readline prompts
- Connection menu: pair code or session ID
- Console commands: status, config, commands, restart, stop, exit, help
- Colored terminal output with ANSI codes
- Minimal HTTP server on port 5000 (required by Replit, shows plain text status)

### Bot Engine (server/bot/)
- **Connection** (`connection.ts`): WhatsApp connection via `@whiskeysockets/baileys`, supports pair code and session ID auth, reconnection with exponential backoff, session stored in `session/` directory
- **Command Loader** (`commandLoader.ts`): Dynamically loads .js command files from `server/bot/commands/` organized by category directories. Handles edge cases like `religious.js` directory and root-level .js files
- **Message Handler** (`messageHandler.ts`): Processes WhatsApp messages, routes commands based on prefix, enforces 5 bot modes (public, private, silent, group-only, maintenance)
- **Config**: Bot configuration in `server/bot/bot_config.json` (prefix, mode, owner number, bot name)
- **Utils** (`server/bot/utils/`): foxEconomy, foxGames, foxGroup, foxMaster, standalonePermissions
- **Handlers** (`server/bot/handlers/`): prefixHandler

### Connection Methods
1. **Pair Code**: Enter phone number (country code + digits), WhatsApp sends 8-digit code to link device
2. **Session ID**: Paste a session string in formats: FOXY:~<base64>, FOXY-BOT:<base64>, WOLF-BOT:<base64>, or plain base64
3. **Reconnect**: If a previous session exists in `session/`, can reconnect automatically

### Bot Modes
- public: Everyone can use the bot
- private: Owner only
- silent: Bot runs but does not respond
- group-only: Works in groups only
- maintenance: Under maintenance, limited access (owner can still use)

### Bot Command Structure
Commands are JavaScript files in `server/bot/commands/{category}/` folders. Each exports:
- `name`, `alias[]`, `description`, `category`, `ownerOnly`
- `execute(sock, msg, args, prefix, extra)` async function

### Data Storage
- **Bot Config**: JSON file at `server/bot/bot_config.json`
- **Auth Session**: Filesystem at `session/` directory using Baileys' `useMultiFileAuthState`
- **No database required** for core functionality

## External Dependencies

### Core
- **@whiskeysockets/baileys**: WhatsApp Web multi-device protocol
- **axios**: HTTP client for command APIs
- **canvas**: Image/text generation for text commands
- **node-fetch**: HTTP requests
- **node-webpmux**: WebP sticker manipulation

### Build
- **tsx**: TypeScript execution
- **typescript**: Type checking

## Running
- `npm run dev` starts the console bot via `tsx server/index.ts`
- The bot prompts for connection method in the terminal
- Type `help` for available console commands while running

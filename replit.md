# Foxy Bot - WhatsApp Bot Dashboard

## Overview

Foxy Bot is a WhatsApp bot with a web-based dashboard for managing the bot's connection, commands, settings, and logs. The bot connects to WhatsApp using the Baileys library (multi-device) and exposes a React dashboard where users can start/stop the bot, scan QR codes for authentication, view live logs, browse available commands, and configure bot settings like prefix and mode.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) — single page dashboard at `/`
- **State Management**: TanStack React Query for server state (API calls), local React state for UI
- **Real-time Updates**: Custom WebSocket hook (`useWebSocket.ts`) connects to `/ws` for live bot status, QR codes, and log streaming
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Key Pages**: Dashboard (main page with tabs for status, commands, logs, settings), 404 page

### Backend (server/)
- **Framework**: Express.js with TypeScript, running on Node.js
- **HTTP Server**: Node's `http.createServer` wrapping Express, used for both HTTP and WebSocket
- **WebSocket**: `ws` library for real-time communication between dashboard and server — broadcasts bot status changes, QR codes, and log entries to all connected clients
- **Bot Engine** (`server/bot/`):
  - **Connection** (`connection.ts`): Manages WhatsApp connection via `@whiskeysockets/baileys`, handles QR generation, reconnection, and session persistence (auth stored in `auth_info/` directory)
  - **Command Loader** (`commandLoader.ts`): Dynamically loads command files from `server/bot/commands/` directory, organized by category subfolders
  - **Message Handler** (`messageHandler.ts`): Processes incoming WhatsApp messages, parses commands with configurable prefix, and routes to appropriate command handlers
  - **Config**: Bot configuration stored in `server/bot/bot_config.json` (prefix, mode, owner number, bot name) — read/written as a flat JSON file
- **API Routes** (in `routes.ts`):
  - `GET/PATCH /api/bot/config` — read/update bot config
  - `GET /api/bot/commands` — list available commands
  - `GET /api/bot/status` — get bot connection status
  - `POST /api/bot/start` — start bot connection
  - `POST /api/bot/stop` — stop bot connection
  - `POST /api/bot/restart` — restart bot connection
- **Development**: Vite dev server with HMR (via `server/vite.ts`), proxied through Express
- **Production**: Vite builds static files to `dist/public`, esbuild bundles server to `dist/index.cjs`

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (configured in `drizzle.config.ts`), though the current schema (`shared/schema.ts`) only contains Zod validation schemas, not Drizzle table definitions. The `IStorage` interface in `server/storage.ts` is currently empty (MemStorage). Database tables may need to be added for persistent features.
- **Bot Config**: Stored as a JSON file (`server/bot/bot_config.json`), not in the database
- **Bot Auth Session**: Stored in filesystem (`auth_info/` directory) using Baileys' `useMultiFileAuthState`
- **Schema Push**: `npm run db:push` uses drizzle-kit to push schema to PostgreSQL

### Shared Code (shared/)
- `schema.ts`: Contains Zod schemas and TypeScript interfaces shared between frontend and backend (BotConfig, BotStatus, BotCommand, LogEntry)

### Build System
- **Dev**: `tsx server/index.ts` runs the server with TypeScript support
- **Build**: Custom `script/build.ts` runs Vite build for client, then esbuild for server, with selective dependency bundling via an allowlist
- **Path Aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Bot Command Structure
Commands are JavaScript files in `server/bot/commands/{category}/` folders. Each exports an object with:
- `name`, `alias[]`, `description`, `category`, `ownerOnly`
- `execute(sock, msg, args, prefix, extra)` async function

Bot modes: public (everyone), private (owner only), group-only, silent, maintenance.

## External Dependencies

### Core Services
- **PostgreSQL**: Database (required via `DATABASE_URL` environment variable), used with Drizzle ORM. Currently minimal schema — may need tables added for persistent bot features.
- **WhatsApp (Baileys)**: `@whiskeysockets/baileys` library for WhatsApp Web multi-device protocol — handles QR auth, message sending/receiving, session management

### Key Libraries
- **Express**: HTTP server framework
- **ws**: WebSocket server for real-time dashboard updates
- **Drizzle ORM + drizzle-zod**: Database ORM and schema validation
- **Zod**: Runtime type validation for configs and API inputs
- **TanStack React Query**: Server state management on frontend
- **Vite + esbuild**: Build tooling
- **shadcn/ui + Radix UI + Tailwind CSS**: UI component system
- **qrcode**: Client-side QR code rendering on canvas

### External APIs
- Some bot commands reference external APIs (e.g., `api.lolhuman.xyz` for animated text), but these are optional per-command integrations, not core dependencies
<div align="center">

<img src="https://i.ibb.co/PGYDVrqk/7aa433284119.jpg" alt="FOXY Bot" width="400"/>

# 🦊 FOXY — WhatsApp Bot

**568 commands across 70 categories**

[![GitHub repo](https://img.shields.io/badge/GitHub-7silent--wolf%2FFOXY-blue?logo=github)](https://github.com/7silent-wolf/FOXY)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Library-Baileys-orange)](https://github.com/WhiskeySockets/Baileys)

</div>

---

## 🚀 Quick Deploy

### ☁️ Deploy on Replit

[![Run on Replit](https://replit.com/badge/github/7silent-wolf/FOXY)](https://replit.com/github/7silent-wolf/FOXY)

### 📦 Download ZIP

[![Download ZIP](https://img.shields.io/badge/Download-ZIP-blue?logo=github)](https://github.com/7silent-wolf/FOXY/archive/refs/heads/main.zip)

```bash
# Clone the repo
git clone https://github.com/7silent-wolf/FOXY.git
cd FOXY
npm install
```

---

## 🔗 Pair Your Number

> Get your session ID without scanning a QR code

**👉 [foxypair.xwolf.space](https://foxypair.xwolf.space)**

1. Open the pair site above
2. Enter your WhatsApp number
3. Copy the session ID shown
4. Set it as your `SESSION_ID` environment variable

---

## ⚙️ Setup

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `SESSION_ID` | WhatsApp session (`FOXY:~<Base64>`) | ✅ |
| `PREFIX` | Command prefix (default: `*`) | ❌ |
| `BOT_NAME` | Bot display name (default: `FOXY`) | ❌ |
| `OWNER_NUMBER` | Your WhatsApp number | ❌ |
| `SUPABASE_URL` | Supabase URL for antidelete/autoview | ❌ |
| `SUPABASE_KEY` | Supabase anon key | ❌ |

### Install & Run

```bash
npm install
npm run dev
```

---

## ✨ Features

- 🦊 **568 commands** across 70 categories
- 🗑️ **Antidelete** — recover deleted messages & statuses
- 👁️ **Auto View Status** — automatically view contacts' statuses
- 💬 **Auto React** — react to statuses with 🦊
- 🤖 **AI Commands** — multiple AI integrations
- 🎮 **Games** — TicTacToe, Hangman, Snake & more
- 📸 **Image Generation** — stickers, effects & AI images
- 🔧 **Group Tools** — antilink, antiflood, promote & more
- 📋 **Owner Panel** — full bot management from WhatsApp

---

## 📁 Project Structure

```
FOXY/
├── server/
│   └── bot/
│       ├── commands/        # 568 commands in 70 categories
│       ├── messageHandler.js
│       ├── config/
│       └── lib/
├── loader.js                # Auto-restart loader
├── settings.js              # Bot configuration
└── package.json
```

---

## 🔄 Update

To update from the upstream source:

```
*venup           — Update via ZIP (recommended)
*update git      — Update via Git
```

---

## 📄 License

MIT © [7silent-wolf](https://github.com/7silent-wolf)

---

<div align="center">
Made with 🦊 by <a href="https://github.com/7silent-wolf">Silent Wolf</a>
</div>

import { botConnection } from "./connection.js";
import { commandLoader } from "./commandLoader.js";
import { handleAutoView } from "./commands/automation/autoviewstatus.js";
import { handleAutoReact } from "./commands/automation/autoreactstatus.js";
import { initAntidelete, antideleteStoreMessage, antideleteHandleUpdate, updateAntideleteSock } from "./commands/owner/antidelete.js";
import { initStatusAntidelete, statusAntideleteStoreMessage, statusAntideleteHandleUpdate, updateStatusAntideleteSock } from "./commands/owner/antideletestatus.js";
import { initAutomodEnforcer } from "./lib/automodEnforcer.js";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "server", "bot", "bot_config.json");

const floodMap = new Map();
const FLOOD_LIMIT = 10;
const FLOOD_WINDOW = 5000;

function isFlooding(sender) {
  const now = Date.now();
  if (!floodMap.has(sender)) {
    floodMap.set(sender, [now]);
    return false;
  }
  const timestamps = floodMap.get(sender).filter(t => now - t < FLOOD_WINDOW);
  timestamps.push(now);
  floodMap.set(sender, timestamps);
  return timestamps.length > FLOOD_LIMIT;
}

function loadConfig() {
  const defaults = {
    prefix: ".",
    mode: "public",
    ownerNumber: "",
    botName: "FOXY",
  };
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...defaults, ...data };
    }
  } catch {}
  return defaults;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig() {
  return loadConfig();
}

export function updateConfig(updates) {
  const config = loadConfig();
  const updated = { ...config, ...updates };
  saveConfig(updated);
  return updated;
}

function isOwner(msg, config) {
  if (msg.key.fromMe) return true;
  const sender = (msg.key.participant || msg.key.remoteJid || "")
    .split("@")[0]
    .split(":")[0];
  return sender === config.ownerNumber;
}

let consoleLogger = null;
const attachedSockets = new WeakSet();

function attachMessagesUpdateListener(sock) {
  if (!sock || attachedSockets.has(sock)) return;
  attachedSockets.add(sock);
  sock.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      try { await antideleteHandleUpdate(update); } catch {}
      try { await statusAntideleteHandleUpdate(update); } catch {}
    }
  });
}

export function setupMessageHandler(logger) {
  consoleLogger = logger || null;

  botConnection.on("connected", async () => {
    const sock = botConnection.getSocket();
    if (sock) {
      try { await initAntidelete(sock); } catch (e) { console.error("initAntidelete error:", e.message); }
      try { await initStatusAntidelete(sock); } catch (e) { console.error("initStatusAntidelete error:", e.message); }
      try { initAutomodEnforcer(sock); } catch (e) { console.error("initAutomodEnforcer error:", e.message); }
      attachMessagesUpdateListener(sock);
    }
  });

  botConnection.on("messages", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const m = msg.message?.ephemeralMessage?.message ||
        msg.message?.viewOnceMessage?.message ||
        msg.message?.viewOnceMessageV2?.message ||
        msg.message?.viewOnceMessageV2Extension?.message ||
        msg.message?.documentWithCaptionMessage?.message ||
        msg.message?.editedMessage?.message?.protocolMessage?.editedMessage ||
        msg.message;

      botConnection.incrementReceived();

      if (msg.key.remoteJid === "status@broadcast" && !msg.key.fromMe) {
        const sock = botConnection.getSocket();
        if (sock) {
          try { await handleAutoView(sock, msg.key, msg.message); } catch {}
          try { await handleAutoReact(sock, msg.key); } catch {}
          try { await statusAntideleteStoreMessage(msg); } catch {}
        }
        continue;
      }

      if (!msg.key.fromMe) {
        try { await antideleteStoreMessage(msg); } catch {}
        if (consoleLogger) {
          try { consoleLogger(msg); } catch {}
        }
      }

      const body =
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        m?.buttonsResponseMessage?.selectedButtonId ||
        m?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m?.templateButtonReplyMessage?.selectedId ||
        "";

      const config = loadConfig();
      global.prefix = config.prefix;
      global.PREFIX = config.prefix;

      const sender = msg.key.participant || msg.key.remoteJid || "";
      if (isFlooding(sender)) continue;

      if (!body.startsWith(config.prefix)) continue;

      const fullCmd = body.slice(config.prefix.length).trim();
      const args = fullCmd.split(/\s+/);
      const cmdName = args.shift()?.toLowerCase();

      if (!cmdName) continue;

      const command = commandLoader.findCommand(cmdName);
      if (!command) continue;

      if (config.mode === "private" && !isOwner(msg, config)) {
        continue;
      }

      if (config.mode === "group-only" && !msg.key.remoteJid?.endsWith("@g.us")) {
        continue;
      }

      if (config.mode === "dms-only" && msg.key.remoteJid?.endsWith("@g.us")) {
        continue;
      }

      if (command.ownerOnly && !isOwner(msg, config)) {
        const sock = botConnection.getSocket();
        if (sock) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: "This command is for the bot owner only.",
          }, { quoted: msg });
        }
        continue;
      }

      const sock = botConnection.getSocket();
      if (!sock) continue;

      const jidManager = {
        isOwner: (m) => isOwner(m, config),
        cleanJid: (jid) => {
          const clean = jid.split("@")[0].split(":")[0];
          return { cleanJid: jid, cleanNumber: clean, isLid: jid.includes(":") };
        },
        getOwnerInfo: () => ({
          cleanNumber: config.ownerNumber,
        }),
      };

      const prefixHandler = {
        getPrefix: () => config.prefix,
        resetPrefix: () => {
          updateConfig({ prefix: "." });
          return { message: "Prefix reset to default (.)", newPrefix: "." };
        },
        setPrefix: (newPrefix) => {
          updateConfig({ prefix: newPrefix });
          return { message: `Prefix changed to ${newPrefix}`, newPrefix };
        },
      };

      const extra = {
        jidManager,
        prefixHandler,
        isOwner: () => isOwner(msg, config),
        BOT_NAME: config.botName,
        commands: commandLoader.getCommandsMap(),
      };

      const chatType = msg.key.remoteJid?.endsWith("@g.us") ? "GROUP" : "DM";
      const senderNum = (msg.key.participant || msg.key.remoteJid || "").split("@")[0].split(":")[0];
      console.log(`⚡ [CMD] ${config.prefix}${cmdName}${args.length ? " " + args.join(" ") : ""} | From: ${senderNum} | ${chatType}`);

      try {
        await command.execute(sock, msg, args, config.prefix, extra);
        botConnection.incrementSent();
      } catch (error) {
        try {
          await sock.sendMessage(
            msg.key.remoteJid,
            { text: `Error: ${error.message}` },
            { quoted: msg }
          );
        } catch {}
      }
    }
  });
}

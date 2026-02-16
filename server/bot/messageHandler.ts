import { botConnection } from "./connection";
import { commandLoader } from "./commandLoader";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "server", "bot", "bot_config.json");

interface BotConfig {
  prefix: string;
  mode: string;
  ownerNumber: string;
  botName: string;
}

function loadConfig(): BotConfig {
  const defaults: BotConfig = {
    prefix: ".",
    mode: "public",
    ownerNumber: "",
    botName: "Foxy Bot",
  };
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...defaults, ...data };
    }
  } catch {}
  return defaults;
}

function saveConfig(config: BotConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(): BotConfig {
  return loadConfig();
}

export function updateConfig(updates: Partial<BotConfig>) {
  const config = loadConfig();
  const updated = { ...config, ...updates };
  saveConfig(updated);
  return updated;
}

function isOwner(msg: any, config: BotConfig): boolean {
  if (msg.key.fromMe) return true;
  const sender = (msg.key.participant || msg.key.remoteJid || "")
    .split("@")[0]
    .split(":")[0];
  return sender === config.ownerNumber;
}

export function setupMessageHandler() {
  botConnection.on("messages", async ({ messages, type }: any) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      botConnection.incrementReceived();

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

      const config = loadConfig();

      if (!body.startsWith(config.prefix)) continue;

      const fullCmd = body.slice(config.prefix.length).trim();
      const args = fullCmd.split(/\s+/);
      const cmdName = args.shift()?.toLowerCase();

      if (!cmdName) continue;

      const command = commandLoader.findCommand(cmdName);
      if (!command) continue;

      if (config.mode === "private" && !isOwner(msg, config)) {
        botConnection.addLog("info", `Blocked (private mode): ${cmdName} from ${msg.key.remoteJid}`);
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

      botConnection.addLog("info", `Command: ${config.prefix}${cmdName} from ${msg.key.remoteJid?.split("@")[0]}`);

      const sock = botConnection.getSocket();
      if (!sock) continue;

      const jidManager = {
        isOwner: (m: any) => isOwner(m, config),
        cleanJid: (jid: string) => {
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
        setPrefix: (newPrefix: string) => {
          updateConfig({ prefix: newPrefix });
          return { message: `Prefix changed to ${newPrefix}`, newPrefix };
        },
      };

      const extra = {
        jidManager,
        prefixHandler,
        isOwner: isOwner(msg, config),
        BOT_NAME: config.botName,
        commands: commandLoader.getCommands(),
      };

      try {
        await command.execute(sock, msg, args, config.prefix, extra);
        botConnection.incrementSent();
      } catch (error: any) {
        botConnection.addLog("error", `Command ${cmdName} error: ${error.message}`);
        try {
          await sock.sendMessage(
            msg.key.remoteJid,
            { text: `Error executing command: ${error.message}` },
            { quoted: msg }
          );
        } catch {}
      }
    }
  });
}

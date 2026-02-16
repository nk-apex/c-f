import * as readline from "readline";
import http from "http";
import { botConnection } from "./bot/connection";
import { commandLoader } from "./bot/commandLoader";
import { setupMessageHandler, getConfig, updateConfig } from "./bot/messageHandler";

const PORT = parseInt(process.env.PORT || "5000", 10);
const httpServer = http.createServer((_req, res) => {
  const status = botConnection.getStatus();
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`Foxy Bot is running.\nState: ${status.state}\nCommands loaded: ${commandLoader.getCommands().length}\n`);
});
httpServer.listen(PORT, "0.0.0.0");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

function c(color: string, text: string) {
  return `${color}${text}${COLORS.reset}`;
}

function printBanner() {
  console.log(c(COLORS.cyan, `
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║      ${c(COLORS.bright + COLORS.yellow, "FOXY BOT")}${c(COLORS.cyan, " - WhatsApp Bot")}        ║
  ║                                      ║
  ╚══════════════════════════════════════╝
  `));
}

function printLog(level: string, message: string) {
  const time = new Date().toLocaleTimeString();
  let levelStr: string;
  switch (level) {
    case "info":
      levelStr = c(COLORS.green, "[INFO] ");
      break;
    case "warn":
      levelStr = c(COLORS.yellow, "[WARN] ");
      break;
    case "error":
      levelStr = c(COLORS.red, "[ERROR]");
      break;
    default:
      levelStr = c(COLORS.dim, `[${level.toUpperCase()}]`);
  }
  console.log(`  ${c(COLORS.dim, time)} ${levelStr} ${message}`);
}

function printPairingCode(code: string) {
  console.log("");
  console.log(c(COLORS.bgGreen + COLORS.bright, "  ═══════════════════════════════════  "));
  console.log(c(COLORS.bgGreen + COLORS.bright, `       PAIRING CODE: ${code}        `));
  console.log(c(COLORS.bgGreen + COLORS.bright, "  ═══════════════════════════════════  "));
  console.log("");
  console.log(c(COLORS.yellow, "  How to pair:"));
  console.log(c(COLORS.white, "  1. Open WhatsApp on your phone"));
  console.log(c(COLORS.white, "  2. Go to Settings > Linked Devices"));
  console.log(c(COLORS.white, "  3. Tap 'Link a Device'"));
  console.log(c(COLORS.white, "  4. Choose 'Link with phone number instead'"));
  console.log(c(COLORS.white, "  5. Enter the 8-digit code above"));
  console.log("");
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function showMainMenu(rl: readline.Interface) {
  const config = getConfig();

  console.log("");
  console.log(c(COLORS.cyan, "  ─── Connection Method ───"));
  console.log("");
  console.log(c(COLORS.white, "  1) ") + c(COLORS.green, "Pair Code") + c(COLORS.dim, " (phone number → WhatsApp sends 8-digit code)"));
  console.log(c(COLORS.white, "  2) ") + c(COLORS.blue, "Session ID") + c(COLORS.dim, " (paste FOXY:~... or base64 session string)"));

  const hasSession = botConnection.hasExistingSession();
  if (hasSession) {
    console.log(c(COLORS.white, "  3) ") + c(COLORS.yellow, "Reconnect") + c(COLORS.dim, " (use existing saved session)"));
  }

  console.log("");
  console.log(c(COLORS.dim, `  Current config: prefix="${config.prefix}" mode="${config.mode}" bot="${config.botName}"`));
  console.log("");

  const choice = await ask(rl, c(COLORS.cyan, "  Choose [1/2" + (hasSession ? "/3" : "") + "]: "));

  if (choice === "1") {
    await startWithPairCode(rl);
  } else if (choice === "2") {
    await startWithSessionId(rl);
  } else if (choice === "3" && hasSession) {
    await reconnectExisting();
  } else {
    console.log(c(COLORS.red, "  Invalid choice. Try again."));
    await showMainMenu(rl);
  }
}

async function startWithPairCode(rl: readline.Interface) {
  console.log("");
  const phone = await ask(rl, c(COLORS.green, "  Enter phone number (country code + number, e.g. 254788710904): "));

  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length < 10) {
    console.log(c(COLORS.red, "  Invalid phone number. Must be at least 10 digits with country code."));
    await startWithPairCode(rl);
    return;
  }

  console.log("");
  printLog("info", `Connecting with phone number: ${cleaned}`);
  console.log(c(COLORS.dim, "  Waiting for pairing code from WhatsApp..."));
  console.log("");

  try {
    await botConnection.connect("pair", cleaned);
  } catch (error: any) {
    printLog("error", `Connection failed: ${error.message}`);
  }
}

async function startWithSessionId(rl: readline.Interface) {
  console.log("");
  const sessionId = await ask(rl, c(COLORS.blue, "  Paste your Session ID (FOXY:~... or base64): "));

  if (!sessionId.trim()) {
    console.log(c(COLORS.red, "  Session ID cannot be empty."));
    await startWithSessionId(rl);
    return;
  }

  console.log("");
  printLog("info", "Connecting with Session ID...");

  try {
    await botConnection.connect("session", sessionId);
  } catch (error: any) {
    printLog("error", `Connection failed: ${error.message}`);
  }
}

async function reconnectExisting() {
  console.log("");
  printLog("info", "Reconnecting with saved session...");

  try {
    await botConnection.connect("pair");
  } catch (error: any) {
    printLog("error", `Reconnection failed: ${error.message}`);
  }
}

function setupConsoleCommands(rl: readline.Interface) {
  rl.on("line", async (input) => {
    const cmd = input.trim().toLowerCase();

    if (cmd === "help" || cmd === "h") {
      console.log("");
      console.log(c(COLORS.cyan, "  ─── Console Commands ───"));
      console.log(c(COLORS.white, "  status    ") + c(COLORS.dim, "Show bot connection status"));
      console.log(c(COLORS.white, "  config    ") + c(COLORS.dim, "Show current bot config"));
      console.log(c(COLORS.white, "  commands  ") + c(COLORS.dim, "List loaded bot commands"));
      console.log(c(COLORS.white, "  restart   ") + c(COLORS.dim, "Restart the bot connection"));
      console.log(c(COLORS.white, "  stop      ") + c(COLORS.dim, "Stop and disconnect the bot"));
      console.log(c(COLORS.white, "  exit      ") + c(COLORS.dim, "Exit the application"));
      console.log("");
    } else if (cmd === "status" || cmd === "s") {
      const status = botConnection.getStatus();
      console.log("");
      console.log(c(COLORS.cyan, "  ─── Bot Status ───"));
      console.log(c(COLORS.white, `  State:        ${status.state}`));
      console.log(c(COLORS.white, `  Name:         ${status.name || "N/A"}`));
      console.log(c(COLORS.white, `  Phone:        ${status.phoneNumber || "N/A"}`));
      console.log(c(COLORS.white, `  Uptime:       ${status.uptime}s`));
      console.log(c(COLORS.white, `  Msgs In:      ${status.messagesReceived}`));
      console.log(c(COLORS.white, `  Msgs Out:     ${status.messagesSent}`));
      console.log("");
    } else if (cmd === "config" || cmd === "c") {
      const config = getConfig();
      console.log("");
      console.log(c(COLORS.cyan, "  ─── Bot Config ───"));
      console.log(c(COLORS.white, `  Bot Name:     ${config.botName}`));
      console.log(c(COLORS.white, `  Prefix:       ${config.prefix}`));
      console.log(c(COLORS.white, `  Mode:         ${config.mode}`));
      console.log(c(COLORS.white, `  Owner:        ${config.ownerNumber || "Not set"}`));
      console.log("");
    } else if (cmd === "commands" || cmd === "cmd") {
      const cmds = commandLoader.getCommands();
      const categories = commandLoader.getCategories();
      console.log("");
      console.log(c(COLORS.cyan, `  ─── ${cmds.length} Commands ───`));
      for (const [cat, catCmds] of Object.entries(categories)) {
        console.log(c(COLORS.yellow, `  ${cat} (${catCmds.length}):`));
        const names = catCmds.map((cc) => cc.name).join(", ");
        console.log(c(COLORS.dim, `    ${names}`));
      }
      console.log("");
    } else if (cmd === "restart" || cmd === "r") {
      printLog("info", "Restarting bot...");
      try {
        await botConnection.restart();
      } catch (error: any) {
        printLog("error", `Restart failed: ${error.message}`);
      }
    } else if (cmd === "stop") {
      printLog("info", "Stopping bot...");
      try {
        await botConnection.disconnect();
        printLog("info", "Bot stopped. Type 'exit' to quit or connect again.");
      } catch (error: any) {
        printLog("error", `Stop failed: ${error.message}`);
      }
    } else if (cmd === "exit" || cmd === "quit" || cmd === "q") {
      printLog("info", "Shutting down...");
      try {
        await botConnection.disconnect();
      } catch {}
      process.exit(0);
    } else if (cmd) {
      console.log(c(COLORS.dim, `  Unknown command: "${cmd}". Type "help" for available commands.`));
    }
  });
}

async function main() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  botConnection.on("log", (entry: any) => {
    printLog(entry.level, entry.message);
  });

  botConnection.on("pairing_code", (code: string) => {
    printPairingCode(code);
  });

  botConnection.on("connected", async () => {
    const status = botConnection.getStatus();
    const config = getConfig();
    console.log("");
    console.log(c(COLORS.bgGreen + COLORS.bright, "  ═══════════════════════════════════  "));
    console.log(c(COLORS.bgGreen + COLORS.bright, "         CONNECTED SUCCESSFULLY         "));
    console.log(c(COLORS.bgGreen + COLORS.bright, "  ═══════════════════════════════════  "));
    console.log("");
    if (status.name) console.log(c(COLORS.green, `  Name:   ${status.name}`));
    if (status.phoneNumber) console.log(c(COLORS.green, `  Phone:  +${status.phoneNumber}`));
    console.log(c(COLORS.green, `  Prefix: ${config.prefix}`));
    console.log("");
    console.log(c(COLORS.dim, "  Type 'help' for console commands."));
    console.log("");

    try {
      const sock = botConnection.getSocket();
      if (sock && status.phoneNumber) {
        const botJid = status.phoneNumber.includes("@") ? status.phoneNumber : `${status.phoneNumber}@s.whatsapp.net`;
        const cmds = commandLoader.getCommands();
        const successMsg = `┌─⧭ FOX-CORE ONLINE
├◆ Status: Connected
├◆ Name: ${status.name || 'Foxy Bot'}
├◆ Prefix: ${config.prefix}
├◆ Commands: ${cmds.length}
├◆ Mode: ${config.mode}
└─⧭`;
        await sock.sendMessage(botJid, { text: successMsg });
        printLog("info", "Success message sent to WhatsApp");
      }
    } catch (err: any) {
      printLog("warn", `Could not send success message: ${err.message}`);
    }
  });

  botConnection.on("disconnected", (reason: string) => {
    if (reason === "logged_out") {
      console.log(c(COLORS.red, "\n  Session expired. You need to connect again.\n"));
    }
  });

  printLog("info", "Loading commands...");
  await commandLoader.loadCommands();
  setupMessageHandler();

  const cmds = commandLoader.getCommands();
  const categories = commandLoader.getCategories();
  printLog("info", `Loaded ${cmds.length} commands from ${Object.keys(categories).length} categories`);

  await showMainMenu(rl);

  setupConsoleCommands(rl);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

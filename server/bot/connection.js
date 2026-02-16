import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

const SESSION_DIR = path.join(process.cwd(), "session");

function parseFoxySession(sessionString) {
  let cleaned = sessionString.trim().replace(/^["']|["']$/g, "");

  if (cleaned.startsWith("FOXY:~")) {
    const base64Part = cleaned.substring(6).trim();
    if (!base64Part) throw new Error("No data found after FOXY:~");
    try {
      return JSON.parse(Buffer.from(base64Part, "base64").toString("utf8"));
    } catch {
      return JSON.parse(base64Part);
    }
  }

  if (cleaned.startsWith("FOXY-BOT:")) {
    const base64Part = cleaned.substring(9).trim();
    if (!base64Part) throw new Error("No data found after FOXY-BOT:");
    try {
      return JSON.parse(Buffer.from(base64Part, "base64").toString("utf8"));
    } catch {
      return JSON.parse(base64Part);
    }
  }

  if (cleaned.startsWith("WOLF-BOT:")) {
    const base64Part = cleaned.substring(9).trim();
    if (!base64Part) throw new Error("No data found after WOLF-BOT:");
    try {
      return JSON.parse(Buffer.from(base64Part, "base64").toString("utf8"));
    } catch {
      return JSON.parse(base64Part);
    }
  }

  try {
    return JSON.parse(Buffer.from(cleaned, "base64").toString("utf8"));
  } catch {
    return JSON.parse(cleaned);
  }
}

const silentLogger = {
  level: "silent",
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => silentLogger,
};

class BotConnection extends EventEmitter {
  constructor() {
    super();
    this.sock = null;
    this.status = {
      state: "disconnected",
      pairingCode: null,
      phoneNumber: null,
      name: null,
      uptime: 0,
      startTime: null,
      messagesReceived: 0,
      messagesSent: 0,
    };
    this.retryCount = 0;
    this.maxRetries = 10;
    this.logs = [];
    this.loginMode = "pair";
    this.loginData = null;
    this.isWaitingForPairing = false;
  }

  getSocket() {
    return this.sock;
  }

  getStatus() {
    if (this.status.startTime) {
      this.status.uptime = Math.floor((Date.now() - this.status.startTime) / 1000);
    }
    return { ...this.status };
  }

  getLogs() {
    return this.logs.slice(-100);
  }

  addLog(level, message) {
    const entry = { time: new Date().toISOString(), level, message };
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-300);
    }
    this.emit("log", entry);
  }

  incrementReceived() {
    this.status.messagesReceived++;
  }

  incrementSent() {
    this.status.messagesSent++;
  }

  async authenticateWithSessionId(sessionId) {
    try {
      this.addLog("info", "Processing Session ID...");
      const sessionData = parseFoxySession(sessionId);

      if (!sessionData) {
        throw new Error("Could not parse session data");
      }

      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }

      const filePath = path.join(SESSION_DIR, "creds.json");
      fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
      this.addLog("info", "Session ID saved to session/creds.json");
      return true;
    } catch (error) {
      this.addLog("error", `Session authentication failed: ${error.message}`);
      throw error;
    }
  }

  async connect(mode = "pair", data) {
    try {
      this.loginMode = mode;
      this.loginData = data || null;
      this.status.state = "connecting";
      this.status.pairingCode = null;
      this.isWaitingForPairing = false;
      this.emit("status_change");
      this.addLog("info", "Starting WhatsApp connection...");

      if (mode === "session" && data) {
        try {
          await this.authenticateWithSessionId(data);
          this.addLog("info", "Session ID authentication completed");
        } catch (error) {
          this.addLog("error", `Session ID auth failed: ${error.message}`);
          this.status.state = "disconnected";
          this.emit("status_change");
          throw new Error(`Invalid session ID: ${error.message}`);
        }
      }

      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
      const { version } = await fetchLatestBaileysVersion();

      this.addLog("info", `Baileys version: ${version.join(".")}`);

      this.sock = makeWASocket({
        version,
        logger: silentLogger,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        connectTimeoutMs: 40000,
        keepAliveIntervalMs: 15000,
        emitOwnEvents: true,
        getMessage: async () => null,
        defaultQueryTimeoutMs: 20000,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (
          this.loginMode === "pair" &&
          this.loginData &&
          !state.creds.registered &&
          connection === "connecting" &&
          !this.isWaitingForPairing
        ) {
          this.isWaitingForPairing = true;
          this.addLog("info", `Requesting pairing code for ${this.loginData}...`);

          const requestCode = async (attempt = 1) => {
            try {
              const code = await this.sock.requestPairingCode(this.loginData);
              const cleanCode = code.replace(/\s+/g, "");
              let formatted = cleanCode;
              if (cleanCode.length === 8) {
                formatted = `${cleanCode.substring(0, 4)}-${cleanCode.substring(4)}`;
              }

              this.status.state = "pairing";
              this.status.pairingCode = formatted;
              this.status.phoneNumber = this.loginData;
              this.addLog("info", `Pairing code generated: ${formatted}`);
              this.emit("pairing_code", formatted);
              this.emit("status_change");
            } catch (error) {
              if (attempt < 3) {
                this.addLog("warn", `Pairing code attempt ${attempt} failed, retrying...`);
                setTimeout(() => requestCode(attempt + 1), 3000);
              } else {
                this.addLog("error", `Failed to get pairing code after ${attempt} attempts: ${error.message}`);
                this.status.state = "disconnected";
                this.emit("status_change");
              }
            }
          };

          setTimeout(() => requestCode(1), 5000);
        }

        if (connection === "close") {
          const reason = lastDisconnect?.error?.output?.statusCode;
          this.addLog("warn", `Connection closed. Reason: ${reason || "unknown"}`);
          this.isWaitingForPairing = false;

          if (
            reason === DisconnectReason.loggedOut ||
            reason === 401 ||
            reason === 403 ||
            reason === 419
          ) {
            this.addLog("error", "Session expired or logged out. Clearing auth.");
            this.status.state = "disconnected";
            this.status.pairingCode = null;
            this.status.phoneNumber = null;
            this.status.name = null;
            this.status.startTime = null;
            this.cleanSession();
            this.emit("disconnected", "logged_out");
            this.emit("status_change");
          } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const baseDelay = 4000;
            const maxDelay = 50000;
            const delayTime = Math.min(baseDelay * Math.pow(2, this.retryCount - 1), maxDelay);
            this.addLog("info", `Reconnecting in ${Math.round(delayTime / 1000)}s... (attempt ${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => this.connect(this.loginMode, this.loginData || undefined), delayTime);
          } else {
            this.addLog("error", "Max retries reached. Stopping.");
            this.status.state = "disconnected";
            this.retryCount = 0;
            this.emit("disconnected", "max_retries");
            this.emit("status_change");
          }
        }

        if (connection === "open") {
          this.retryCount = 0;
          this.isWaitingForPairing = false;
          this.status.state = "connected";
          this.status.pairingCode = null;
          this.status.startTime = Date.now();
          const me = this.sock?.user;
          this.status.phoneNumber = me?.id?.split(":")[0] || me?.id?.split("@")[0] || null;
          this.status.name = me?.name || null;
          this.addLog("info", `Connected as ${this.status.name || this.status.phoneNumber}`);
          this.emit("connected");
          this.emit("status_change");
        }
      });

      this.sock.ev.on("messages.upsert", (m) => {
        this.emit("messages", m);
      });
    } catch (error) {
      this.addLog("error", `Connection error: ${error.message}`);
      this.status.state = "disconnected";
      this.emit("status_change");
      throw error;
    }
  }

  cleanSession() {
    try {
      if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        this.addLog("info", "Session directory cleaned");
      }
    } catch (err) {
      this.addLog("warn", `Failed to clean session: ${err.message}`);
    }
  }

  async disconnect() {
    if (this.sock) {
      this.addLog("info", "Disconnecting...");
      try {
        await this.sock.logout();
      } catch {}
      this.sock = null;
      this.status.state = "disconnected";
      this.status.pairingCode = null;
      this.status.phoneNumber = null;
      this.status.name = null;
      this.status.startTime = null;
      this.cleanSession();
      this.addLog("info", "Disconnected and session cleared.");
      this.emit("disconnected", "manual");
      this.emit("status_change");
    }
  }

  async restart() {
    this.addLog("info", "Restarting bot...");
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
    }
    this.retryCount = 0;
    this.isWaitingForPairing = false;
    await this.connect(this.loginMode, this.loginData || undefined);
  }

  hasExistingSession() {
    const credsPath = path.join(SESSION_DIR, "creds.json");
    return fs.existsSync(credsPath);
  }
}

export const botConnection = new BotConnection();

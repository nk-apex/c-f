import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

const AUTH_DIR = path.join(process.cwd(), "auth_info");

export interface BotStatus {
  state: "disconnected" | "connecting" | "qr" | "connected";
  qrCode: string | null;
  phoneNumber: string | null;
  name: string | null;
  uptime: number;
  startTime: number | null;
  messagesReceived: number;
  messagesSent: number;
}

class BotConnection extends EventEmitter {
  private sock: WASocket | null = null;
  private status: BotStatus = {
    state: "disconnected",
    qrCode: null,
    phoneNumber: null,
    name: null,
    uptime: 0,
    startTime: null,
    messagesReceived: 0,
    messagesSent: 0,
  };
  private retryCount = 0;
  private maxRetries = 5;
  private logs: Array<{ time: string; level: string; message: string }> = [];

  getSocket(): WASocket | null {
    return this.sock;
  }

  getStatus(): BotStatus {
    if (this.status.startTime) {
      this.status.uptime = Math.floor(
        (Date.now() - this.status.startTime) / 1000
      );
    }
    return { ...this.status };
  }

  getLogs() {
    return this.logs.slice(-100);
  }

  addLog(level: string, message: string) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
    };
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

  async connect() {
    try {
      this.status.state = "connecting";
      this.addLog("info", "Starting WhatsApp connection...");

      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();

      this.addLog("info", `Using Baileys version: ${version.join(".")}`);

      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, {
            level: "silent",
            child: () => ({
              level: "silent",
              trace: () => {},
              debug: () => {},
              info: () => {},
              warn: () => {},
              error: () => {},
              fatal: () => {},
            }),
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
          } as any),
        },
        printQRInTerminal: false,
        browser: ["Foxy Bot", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on(
        "connection.update",
        (update: Partial<BaileysEventMap["connection.update"]>) => {
          const { connection, lastDisconnect, qr } = update as any;

          if (qr) {
            this.status.state = "qr";
            this.status.qrCode = qr;
            this.addLog("info", "QR code generated - scan with WhatsApp");
            this.emit("qr", qr);
          }

          if (connection === "close") {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
            this.addLog(
              "warn",
              `Connection closed. Reason: ${reason || "unknown"}`
            );

            if (reason === DisconnectReason.loggedOut) {
              this.addLog("error", "Logged out. Clearing auth and stopping.");
              this.status.state = "disconnected";
              this.status.qrCode = null;
              this.status.phoneNumber = null;
              this.status.name = null;
              this.status.startTime = null;
              if (fs.existsSync(AUTH_DIR)) {
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
              }
              this.emit("disconnected", "logged_out");
            } else if (this.retryCount < this.maxRetries) {
              this.retryCount++;
              this.addLog(
                "info",
                `Reconnecting... (attempt ${this.retryCount}/${this.maxRetries})`
              );
              setTimeout(() => this.connect(), 3000);
            } else {
              this.addLog("error", "Max retries reached. Stopping.");
              this.status.state = "disconnected";
              this.emit("disconnected", "max_retries");
            }
          }

          if (connection === "open") {
            this.retryCount = 0;
            this.status.state = "connected";
            this.status.qrCode = null;
            this.status.startTime = Date.now();
            const me = this.sock?.user;
            this.status.phoneNumber = me?.id?.split(":")[0] || me?.id || null;
            this.status.name = me?.name || null;
            this.addLog(
              "info",
              `Connected as ${this.status.name || this.status.phoneNumber}`
            );
            this.emit("connected");
          }
        }
      );

      this.sock.ev.on("messages.upsert", (m: any) => {
        this.emit("messages", m);
      });
    } catch (error: any) {
      this.addLog("error", `Connection error: ${error.message}`);
      this.status.state = "disconnected";
    }
  }

  async disconnect() {
    if (this.sock) {
      this.addLog("info", "Disconnecting...");
      await this.sock.logout().catch(() => {});
      this.sock = null;
      this.status.state = "disconnected";
      this.status.qrCode = null;
      this.status.phoneNumber = null;
      this.status.name = null;
      this.status.startTime = null;
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      this.addLog("info", "Disconnected and auth cleared.");
      this.emit("disconnected", "manual");
    }
  }

  async restart() {
    this.addLog("info", "Restarting bot...");
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
    }
    this.retryCount = 0;
    await this.connect();
  }
}

export const botConnection = new BotConnection();

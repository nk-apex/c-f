import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { botConnection } from "./bot/connection";
import { commandLoader } from "./bot/commandLoader";
import { setupMessageHandler, getConfig, updateConfig } from "./bot/messageHandler";
import { botConfigSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await commandLoader.loadCommands();
  setupMessageHandler();

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    const status = botConnection.getStatus();
    ws.send(JSON.stringify({ type: "status", data: status }));

    const existingLogs = botConnection.getLogs();
    for (const log of existingLogs) {
      ws.send(JSON.stringify({ type: "log", data: log }));
    }

    ws.on("close", () => clients.delete(ws));
  });

  function broadcast(type: string, data: any) {
    const msg = JSON.stringify({ type, data });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  botConnection.on("qr", (qr: string) => {
    broadcast("qr", qr);
    broadcast("status", botConnection.getStatus());
  });

  botConnection.on("connected", () => {
    broadcast("status", botConnection.getStatus());
  });

  botConnection.on("disconnected", () => {
    broadcast("status", botConnection.getStatus());
  });

  botConnection.on("log", (entry: any) => {
    broadcast("log", entry);
  });

  app.get("/api/bot/status", (_req, res) => {
    res.json(botConnection.getStatus());
  });

  app.get("/api/bot/logs", (_req, res) => {
    res.json(botConnection.getLogs());
  });

  app.get("/api/bot/commands", (_req, res) => {
    const commands = commandLoader.getCommands().map((cmd) => ({
      name: cmd.name,
      alias: cmd.alias,
      category: cmd.category,
      description: cmd.description,
      ownerOnly: cmd.ownerOnly,
    }));
    res.json(commands);
  });

  app.get("/api/bot/categories", (_req, res) => {
    const categories = commandLoader.getCategories();
    const result: Record<string, any[]> = {};
    for (const [cat, cmds] of Object.entries(categories)) {
      result[cat] = cmds.map((c) => ({
        name: c.name,
        alias: c.alias,
        description: c.description,
        ownerOnly: c.ownerOnly,
      }));
    }
    res.json(result);
  });

  app.get("/api/bot/config", (_req, res) => {
    res.json(getConfig());
  });

  app.patch("/api/bot/config", (req, res) => {
    const currentConfig = getConfig();
    const merged = { ...currentConfig, ...req.body };
    const result = botConfigSchema.safeParse(merged);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }
    const config = updateConfig(req.body);
    res.json(config);
  });

  app.post("/api/bot/start", async (_req, res) => {
    const currentState = botConnection.getStatus().state;
    if (currentState !== "disconnected") {
      return res.status(400).json({ success: false, message: `Bot is already ${currentState}` });
    }
    try {
      await botConnection.connect();
      res.json({ success: true, message: "Bot starting..." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/bot/stop", async (_req, res) => {
    const currentState = botConnection.getStatus().state;
    if (currentState === "disconnected") {
      return res.status(400).json({ success: false, message: "Bot is not running" });
    }
    try {
      await botConnection.disconnect();
      res.json({ success: true, message: "Bot stopped" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/bot/restart", async (_req, res) => {
    try {
      await botConnection.restart();
      res.json({ success: true, message: "Bot restarting..." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return httpServer;
}

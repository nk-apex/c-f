import { z } from "zod";

export const botConfigSchema = z.object({
  prefix: z.string().min(1).max(5),
  mode: z.enum(["public", "private", "silent", "group-only", "maintenance"]),
  ownerNumber: z.string(),
  botName: z.string(),
});

export type BotConfig = z.infer<typeof botConfigSchema>;

export interface BotStatus {
  state: "disconnected" | "connecting" | "pairing" | "connected";
  pairingCode: string | null;
  phoneNumber: string | null;
  name: string | null;
  uptime: number;
  startTime: number | null;
  messagesReceived: number;
  messagesSent: number;
}

export interface BotCommand {
  name: string;
  alias: string[];
  category: string;
  description: string;
  ownerOnly: boolean;
}

export interface LogEntry {
  time: string;
  level: string;
  message: string;
}

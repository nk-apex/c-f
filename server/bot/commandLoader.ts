import fs from "fs";
import path from "path";
import { botConnection } from "./connection";

export interface BotCommand {
  name: string;
  alias: string[];
  category: string;
  description: string;
  ownerOnly: boolean;
  execute: (sock: any, msg: any, args: string[], prefix: string, extra: any) => Promise<void>;
}

const COMMANDS_DIR = path.join(process.cwd(), "server", "bot", "commands");

class CommandLoader {
  private commands: Map<string, BotCommand> = new Map();
  private aliases: Map<string, string> = new Map();

  getCommands(): BotCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandCount(): number {
    return this.commands.size;
  }

  getCategories(): Record<string, BotCommand[]> {
    const categories: Record<string, BotCommand[]> = {};
    for (const cmd of this.commands.values()) {
      const cat = cmd.category || "uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }
    return categories;
  }

  findCommand(name: string): BotCommand | undefined {
    const lower = name.toLowerCase();
    if (this.commands.has(lower)) return this.commands.get(lower);
    const aliasTarget = this.aliases.get(lower);
    if (aliasTarget) return this.commands.get(aliasTarget);
    return undefined;
  }

  async loadCommands() {
    this.commands.clear();
    this.aliases.clear();

    if (!fs.existsSync(COMMANDS_DIR)) {
      botConnection.addLog("warn", "Commands directory not found");
      return;
    }

    const categories = fs.readdirSync(COMMANDS_DIR).filter((f) => {
      return fs.statSync(path.join(COMMANDS_DIR, f)).isDirectory();
    });

    for (const category of categories) {
      const catDir = path.join(COMMANDS_DIR, category);
      const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".js"));

      for (const file of files) {
        try {
          const filePath = path.join(catDir, file);
          const mod = await import(filePath);
          const cmd = mod.default || mod;

          if (!cmd || !cmd.name) continue;

          const command: BotCommand = {
            name: cmd.name.toLowerCase(),
            alias: (cmd.alias || []).map((a: string) => a.toLowerCase()),
            category: cmd.category || category,
            description: cmd.description || "No description",
            ownerOnly: cmd.ownerOnly || false,
            execute: cmd.execute,
          };

          this.commands.set(command.name, command);

          for (const alias of command.alias) {
            this.aliases.set(alias, command.name);
          }
        } catch (err: any) {
          botConnection.addLog("warn", `Failed to load ${category}/${file}: ${err.message}`);
        }
      }
    }

    botConnection.addLog(
      "info",
      `Loaded ${this.commands.size} commands from ${categories.length} categories`
    );
  }
}

export const commandLoader = new CommandLoader();

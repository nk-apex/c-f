import fs from "fs";
import path from "path";
import { botConnection } from "./connection.js";

const COMMANDS_DIR = path.join(process.cwd(), "server", "bot", "commands");

class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }

  getCommands() {
    return Array.from(this.commands.values());
  }

  getCommandsMap() {
    return this.commands;
  }

  getCommandCount() {
    return this.commands.size;
  }

  getCategories() {
    const categories = {};
    for (const cmd of this.commands.values()) {
      const cat = cmd.category || "uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }
    return categories;
  }

  findCommand(name) {
    const lower = name.toLowerCase();
    if (this.commands.has(lower)) return this.commands.get(lower);
    const aliasTarget = this.aliases.get(lower);
    if (aliasTarget) return this.commands.get(aliasTarget);
    return undefined;
  }

  async loadCommandFile(filePath, category, fileName) {
    try {
      const mod = await import(filePath);
      const cmd = mod.default || mod;

      if (!cmd || !cmd.name) return;

      const command = {
        name: cmd.name.toLowerCase(),
        alias: (cmd.alias || []).map((a) => a.toLowerCase()),
        category: cmd.category || category,
        description: cmd.description || "No description",
        ownerOnly: cmd.ownerOnly || false,
        execute: cmd.execute,
      };

      this.commands.set(command.name, command);

      for (const alias of command.alias) {
        this.aliases.set(alias, command.name);
      }
    } catch (err) {
      botConnection.addLog("warn", `Failed to load ${category}/${fileName}: ${err.message}`);
    }
  }

  async loadCommands() {
    this.commands.clear();
    this.aliases.clear();

    if (!fs.existsSync(COMMANDS_DIR)) {
      botConnection.addLog("warn", "Commands directory not found");
      return;
    }

    const entries = fs.readdirSync(COMMANDS_DIR);

    for (const entry of entries) {
      const entryPath = path.join(COMMANDS_DIR, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        const categoryName = entry.replace(/\.js$/, "");
        const files = fs.readdirSync(entryPath).filter((f) => f.endsWith(".js"));
        for (const file of files) {
          await this.loadCommandFile(path.join(entryPath, file), categoryName, file);
        }
      } else if (entry.endsWith(".js")) {
        await this.loadCommandFile(entryPath, "general", entry);
      }
    }

    const categories = new Set(Array.from(this.commands.values()).map((c) => c.category));
    botConnection.addLog("info", `Loaded ${this.commands.size} commands from ${categories.size} categories`);
  }
}

export const commandLoader = new CommandLoader();

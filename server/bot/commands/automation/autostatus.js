import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'bot', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'autoReactConfig.json');

function initConfig() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      enabled: true,
      mode: 'fixed',
      fixedEmoji: '\uD83E\uDD8A',
      reactions: ["\uD83E\uDD8A", "\u2764\uFE0F", "\uD83D\uDC4D", "\uD83D\uDD25", "\uD83C\uDF89", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDC4F", "\uD83C\uDFAF", "\uD83D\uDCAF"],
      totalReacted: 0,
      lastReacted: null,
      settings: {
        rateLimitDelay: 500
      }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

initConfig();

function loadReactConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {
      enabled: true, mode: 'fixed', fixedEmoji: '\uD83E\uDD8A',
      reactions: ["\uD83E\uDD8A", "\u2764\uFE0F", "\uD83D\uDC4D", "\uD83D\uDD25", "\uD83C\uDF89"],
      totalReacted: 0, lastReacted: null, settings: { rateLimitDelay: 500 }
    };
  }
}

function saveReactConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {}
}

let lastReactTime = 0;

function getReactionEmoji(config) {
  if (config.mode === 'fixed') {
    return config.fixedEmoji || '\uD83E\uDD8A';
  }
  const list = config.reactions || ['\uD83E\uDD8A'];
  return list[Math.floor(Math.random() * list.length)];
}

export async function handleAutoReact(sock, statusKey) {
  try {
    const config = loadReactConfig();
    if (!config.enabled) return false;

    const now = Date.now();
    if (now - lastReactTime < (config.settings?.rateLimitDelay || 500)) return false;

    const emoji = getReactionEmoji(config);

    await sock.sendMessage(
      'status@broadcast',
      {
        react: {
          text: emoji,
          key: statusKey
        }
      }
    );

    lastReactTime = now;
    config.totalReacted = (config.totalReacted || 0) + 1;
    const sender = (statusKey.participant || statusKey.remoteJid || '').split('@')[0];
    config.lastReacted = { sender, emoji, timestamp: now };
    saveReactConfig(config);

    return true;
  } catch (error) {
    if (error.message?.includes('rate-overlimit')) {
      const config = loadReactConfig();
      config.settings.rateLimitDelay = Math.min((config.settings.rateLimitDelay || 500) * 2, 5000);
      saveReactConfig(config);
    }
    return false;
  }
}

export default {
  name: "autoreactstatus",
  alias: ["reactstatus", "statusreact", "sr", "reacts", "foxyreact"],
  description: "Auto-react to WhatsApp statuses (default: fox emoji)",
  category: "Automation",
  ownerOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };

    const config = loadReactConfig();

    if (args.length === 0) {
      const modeText = config.mode === 'fixed' ? `Fixed (${config.fixedEmoji})` : 'Random';
      return sendMessage(
        `\u250C\u2500\u29ED *Auto React Status*\n` +
        `\u251C\u25C6 Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
        `\u251C\u25C6 Mode: ${modeText}\n` +
        `\u251C\u25C6 Total Reacted: ${config.totalReacted || 0}\n` +
        `\u251C\u25C6 Delay: ${config.settings?.rateLimitDelay || 500}ms\n` +
        `\u2502\n` +
        `\u251C\u25C6 Commands:\n` +
        `\u251C\u25C6 ${PREFIX}sr on - Enable\n` +
        `\u251C\u25C6 ${PREFIX}sr off - Disable\n` +
        `\u251C\u25C6 ${PREFIX}sr emoji <emoji> - Set emoji\n` +
        `\u251C\u25C6 ${PREFIX}sr random - Random mode\n` +
        `\u251C\u25C6 ${PREFIX}sr fixed - Fixed mode\n` +
        `\u251C\u25C6 ${PREFIX}sr list - Show emoji list\n` +
        `\u251C\u25C6 ${PREFIX}sr add <emoji> - Add to list\n` +
        `\u251C\u25C6 ${PREFIX}sr remove <emoji> - Remove\n` +
        `\u251C\u25C6 ${PREFIX}sr stats - View stats\n` +
        `\u251C\u25C6 ${PREFIX}sr reset - Reset stats\n` +
        `\u2514\u2500\u29ED`
      );
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'on':
      case 'enable':
      case 'start': {
        if (config.enabled) {
          return sendMessage(
            `\u250C\u2500\u29ED *Auto React Status*\n` +
            `\u251C\u25C6 Already active!\n` +
            `\u251C\u25C6 Emoji: ${config.mode === 'fixed' ? config.fixedEmoji : 'Random'}\n` +
            `\u251C\u25C6 Total reacted: ${config.totalReacted || 0}\n` +
            `\u2514\u2500\u29ED`
          );
        }
        config.enabled = true;
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Enabled! Reacting with ${config.fixedEmoji}\n` +
          `\u251C\u25C6 to all statuses automatically\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'off':
      case 'disable':
      case 'stop': {
        config.enabled = false;
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Disabled! Foxy stopped reacting\n` +
          `\u251C\u25C6 to statuses automatically\n` +
          `\u251C\u25C6 Use ${PREFIX}sr on to enable\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'emoji':
      case 'setemoji':
      case 'set': {
        if (!args[1]) {
          return sendMessage(
            `\u250C\u2500\u29ED *Set React Emoji*\n` +
            `\u251C\u25C6 Current: ${config.fixedEmoji}\n` +
            `\u251C\u25C6 Usage: ${PREFIX}sr emoji <emoji>\n` +
            `\u251C\u25C6 Example: ${PREFIX}sr emoji \uD83E\uDD8A\n` +
            `\u2514\u2500\u29ED`
          );
        }
        const newEmoji = args[1];
        config.fixedEmoji = newEmoji;
        config.mode = 'fixed';
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Emoji set to: ${newEmoji}\n` +
          `\u251C\u25C6 Mode switched to: Fixed\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'random':
      case 'randommode': {
        config.mode = 'random';
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Mode: Random\n` +
          `\u251C\u25C6 Will pick from ${config.reactions?.length || 0} emojis\n` +
          `\u251C\u25C6 ${(config.reactions || []).join(' ')}\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'fixed':
      case 'fixedmode': {
        config.mode = 'fixed';
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Mode: Fixed\n` +
          `\u251C\u25C6 Using: ${config.fixedEmoji}\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'list':
      case 'emojis': {
        const list = config.reactions || [];
        return sendMessage(
          `\u250C\u2500\u29ED *React Emoji List*\n` +
          `\u251C\u25C6 ${list.join(' ') || 'Empty'}\n` +
          `\u251C\u25C6 Total: ${list.length} emojis\n` +
          `\u2502\n` +
          `\u251C\u25C6 Current mode: ${config.mode}\n` +
          `\u251C\u25C6 Fixed emoji: ${config.fixedEmoji}\n` +
          `\u2502\n` +
          `\u251C\u25C6 ${PREFIX}sr add <emoji> to add\n` +
          `\u251C\u25C6 ${PREFIX}sr remove <emoji> to remove\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'add':
      case 'addemoji': {
        if (!args[1]) {
          return sendMessage(
            `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Usage: ${PREFIX}sr add <emoji>\n\u2514\u2500\u29ED`
          );
        }
        const addEmoji = args[1];
        config.reactions = config.reactions || [];
        if (config.reactions.includes(addEmoji)) {
          return sendMessage(
            `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 ${addEmoji} already in the list\n\u2514\u2500\u29ED`
          );
        }
        config.reactions.push(addEmoji);
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Added ${addEmoji} to reaction list\n` +
          `\u251C\u25C6 Total: ${config.reactions.length} emojis\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'remove':
      case 'removeemoji':
      case 'del': {
        if (!args[1]) {
          return sendMessage(
            `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 Usage: ${PREFIX}sr remove <emoji>\n\u2514\u2500\u29ED`
          );
        }
        const rmEmoji = args[1];
        config.reactions = config.reactions || [];
        const idx = config.reactions.indexOf(rmEmoji);
        if (idx === -1) {
          return sendMessage(
            `\u250C\u2500\u29ED *Error*\n\u251C\u25C6 ${rmEmoji} not in the list\n\u2514\u2500\u29ED`
          );
        }
        config.reactions.splice(idx, 1);
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Removed ${rmEmoji} from list\n` +
          `\u251C\u25C6 Remaining: ${config.reactions.length} emojis\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'stats':
      case 'info': {
        let lastInfo = 'Never';
        if (config.lastReacted) {
          const ago = Math.floor((Date.now() - config.lastReacted.timestamp) / 60000);
          lastInfo = `${config.lastReacted.sender} with ${config.lastReacted.emoji} (${ago < 1 ? 'just now' : ago + 'm ago'})`;
        }
        const modeText = config.mode === 'fixed' ? `Fixed (${config.fixedEmoji})` : 'Random';
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Statistics*\n` +
          `\u251C\u25C6 Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
          `\u251C\u25C6 Mode: ${modeText}\n` +
          `\u251C\u25C6 Total Reacted: ${config.totalReacted || 0}\n` +
          `\u251C\u25C6 Last React: ${lastInfo}\n` +
          `\u251C\u25C6 Delay: ${config.settings?.rateLimitDelay || 500}ms\n` +
          `\u251C\u25C6 Emoji List: ${(config.reactions || []).length} emojis\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'reset':
      case 'clear': {
        config.totalReacted = 0;
        config.lastReacted = null;
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Stats reset successfully\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'delay': {
        if (!args[1] || isNaN(args[1])) {
          return sendMessage(
            `\u250C\u2500\u29ED *React Delay*\n` +
            `\u251C\u25C6 Current: ${config.settings?.rateLimitDelay || 500}ms\n` +
            `\u251C\u25C6 Usage: ${PREFIX}sr delay <ms>\n` +
            `\u251C\u25C6 Min: 300ms\n` +
            `\u2514\u2500\u29ED`
          );
        }
        const delay = Math.max(300, parseInt(args[1]));
        config.settings = config.settings || {};
        config.settings.rateLimitDelay = delay;
        saveReactConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *React Delay Updated*\n` +
          `\u251C\u25C6 Set to ${delay}ms\n` +
          `\u2514\u2500\u29ED`
        );
      }

      default:
        return sendMessage(
          `\u250C\u2500\u29ED *Auto React Status*\n` +
          `\u251C\u25C6 Unknown option: ${action}\n` +
          `\u251C\u25C6 Use ${PREFIX}sr for help\n` +
          `\u2514\u2500\u29ED`
        );
    }
  }
};
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'bot', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'autoViewConfig.json');

function initConfig() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      enabled: true,
      totalViewed: 0,
      lastViewed: null,
      settings: {
        rateLimitDelay: 1000
      }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

initConfig();

function loadViewConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { enabled: true, totalViewed: 0, lastViewed: null, settings: { rateLimitDelay: 1000 } };
  }
}

function saveViewConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {}
}

let lastViewTime = 0;

export async function handleAutoView(sock, statusKey) {
  try {
    const config = loadViewConfig();
    if (!config.enabled) return false;

    const now = Date.now();
    if (now - lastViewTime < (config.settings?.rateLimitDelay || 1000)) return false;

    await sock.readMessages([statusKey]);

    lastViewTime = now;
    config.totalViewed = (config.totalViewed || 0) + 1;
    const sender = (statusKey.participant || statusKey.remoteJid || '').split('@')[0];
    config.lastViewed = { sender, timestamp: now };
    saveViewConfig(config);

    return true;
  } catch (error) {
    if (error.message?.includes('rate-overlimit')) {
      const config = loadViewConfig();
      config.settings.rateLimitDelay = Math.min((config.settings.rateLimitDelay || 1000) * 2, 5000);
      saveViewConfig(config);
    }
    return false;
  }
}

export default {
  name: "autoviewstatus",
  alias: ["autoview", "viewstatus", "statusview", "vs"],
  description: "Automatically view WhatsApp statuses",
  category: "Automation",
  ownerOnly: true,

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;

    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };

    const config = loadViewConfig();

    if (args.length === 0) {
      return sendMessage(
        `\u250C\u2500\u29ED *Auto View Status*\n` +
        `\u2502 Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
        `\u2502 Total Viewed: ${config.totalViewed || 0}\n` +
        `\u2502 Delay: ${config.settings?.rateLimitDelay || 1000}ms\n` +
        `\u2502\n` +
        `\u2502 Commands:\n` +
        `\u2502 ${PREFIX}autoview on - Enable\n` +
        `\u2502 ${PREFIX}autoview off - Disable\n` +
        `\u2502 ${PREFIX}autoview stats - View stats\n` +
        `\u2502 ${PREFIX}autoview delay <ms> - Set delay\n` +
        `\u2502 ${PREFIX}autoview reset - Reset stats\n` +
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
            `\u250C\u2500\u29ED *Auto View Status*\n` +
            `\u2502 Already active!\n` +
            `\u2502 Total viewed: ${config.totalViewed || 0}\n` +
            `\u2502 Use ${PREFIX}autoview off to disable\n` +
            `\u2514\u2500\u29ED`
          );
        }
        config.enabled = true;
        saveViewConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Status*\n` +
          `\u2502 Enabled! Foxy will now view\n` +
          `\u2502 all statuses automatically\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'off':
      case 'disable':
      case 'stop': {
        config.enabled = false;
        saveViewConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Status*\n` +
          `\u2502 Disabled! Foxy stopped viewing\n` +
          `\u2502 statuses automatically\n` +
          `\u2502 Use ${PREFIX}autoview on to enable\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'stats':
      case 'info': {
        let lastInfo = 'Never';
        if (config.lastViewed) {
          const ago = Math.floor((Date.now() - config.lastViewed.timestamp) / 60000);
          lastInfo = `${config.lastViewed.sender} (${ago < 1 ? 'just now' : ago + 'm ago'})`;
        }
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Statistics*\n` +
          `\u2502 Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
          `\u2502 Total Viewed: ${config.totalViewed || 0}\n` +
          `\u2502 Last Viewed: ${lastInfo}\n` +
          `\u2502 Delay: ${config.settings?.rateLimitDelay || 1000}ms\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'delay': {
        if (!args[1] || isNaN(args[1])) {
          return sendMessage(
            `\u250C\u2500\u29ED *Auto View Delay*\n` +
            `\u2502 Current: ${config.settings?.rateLimitDelay || 1000}ms\n` +
            `\u2502 Usage: ${PREFIX}autoview delay <ms>\n` +
            `\u2502 Min: 500ms, Recommended: 1000ms\n` +
            `\u2514\u2500\u29ED`
          );
        }
        const delay = Math.max(500, parseInt(args[1]));
        config.settings = config.settings || {};
        config.settings.rateLimitDelay = delay;
        saveViewConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Delay*\n` +
          `\u2502 Updated to ${delay}ms\n` +
          `\u2502 (${delay / 1000}s between views)\n` +
          `\u2514\u2500\u29ED`
        );
      }

      case 'reset':
      case 'clear': {
        config.totalViewed = 0;
        config.lastViewed = null;
        saveViewConfig(config);
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Status*\n` +
          `\u2502 Stats reset successfully\n` +
          `\u2514\u2500\u29ED`
        );
      }

      default:
        return sendMessage(
          `\u250C\u2500\u29ED *Auto View Status*\n` +
          `\u2502 Unknown option: ${action}\n` +
          `\u2502 Use ${PREFIX}autoview for help\n` +
          `\u2514\u2500\u29ED`
        );
    }
  }
};
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');

function loadConfig() {
  try { if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); } catch {}
  return {};
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export default {
  name: 'antileave',
  alias: ['antileft'],
  description: 'Toggle anti-leave: re-add users who leave the group',
  category: 'group',
  ownerOnly: false,

  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;

    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed GROUP ONLY \u29ed\u2500\u2510\n\u2502 This command works in groups only.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    const groupMetadata = await sock.groupMetadata(jid);
    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);

    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, {
        text: '\u250c\u2500\u29ed ACCESS DENIED \u29ed\u2500\u2510\n\u2502 Only group admins can use this command.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
      }, { quoted: msg });
      return;
    }

    const option = args[0]?.toLowerCase();

    if (!option || (option !== 'on' && option !== 'off')) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed ANTI-LEAVE \u29ed\u2500\u2510\n\u2502 Usage: ${PREFIX}antileave on/off\n\u2502 Re-adds users who leave the group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const config = loadConfig();
    if (!config.antileave) config.antileave = {};

    const enabled = option === 'on';
    config.antileave[jid] = enabled;
    saveConfig(config);

    await sock.sendMessage(jid, {
      text: `\u250c\u2500\u29ed ANTI-LEAVE \u29ed\u2500\u2510\n\u2502 Anti-leave has been turned ${enabled ? 'ON' : 'OFF'}.\n\u2502 ${enabled ? 'Users who leave will be re-added.' : 'Users can leave freely.'}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
    }, { quoted: msg });
  }
};

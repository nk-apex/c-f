import fs from 'fs';
import path from 'path';

const WARN_FILE = path.join(process.cwd(), 'server', 'bot', 'data', 'warnings.json');

function loadWarnings() {
  try { if (fs.existsSync(WARN_FILE)) return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8')); } catch {}
  return {};
}

function saveWarnings(data) {
  const dir = path.dirname(WARN_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2));
}

export default {
  name: 'setwarn',
  alias: ['maxwarn', 'warnlimit'],
  description: 'Set max warnings before kick',
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

    const limit = parseInt(args[0]);

    if (!limit || limit < 1 || limit > 99) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed SET WARN \u29ed\u2500\u2510\n\u2502 Usage: ${PREFIX}setwarn <number>\n\u2502 Example: ${PREFIX}setwarn 5\n\u2502 Range: 1-99\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const warnings = loadWarnings();
    if (!warnings[jid]) warnings[jid] = {};
    warnings[jid].maxWarns = limit;
    saveWarnings(warnings);

    await sock.sendMessage(jid, {
      text: `\u250c\u2500\u29ed SET WARN \u29ed\u2500\u2510\n\u2502 Max warnings set to ${limit}.\n\u2502 Users will be kicked after ${limit} warnings.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
    }, { quoted: msg });
  }
};

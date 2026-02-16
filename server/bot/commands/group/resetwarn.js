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

function getTargetUser(msg, args) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentions?.length > 0) return mentions[0];
  if (msg.message?.extendedTextMessage?.contextInfo?.participant) return msg.message.extendedTextMessage.contextInfo.participant;
  if (args.length > 0) { const num = args[0].replace(/[^0-9]/g, ''); if (num.length > 8) return num + '@s.whatsapp.net'; }
  return null;
}

export default {
  name: 'resetwarn',
  alias: ['clearwarn', 'unwarn'],
  description: 'Reset warnings for a user',
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

    const targetUser = getTargetUser(msg, args);

    if (!targetUser) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed RESET WARN \u29ed\u2500\u2510\n\u2502 Usage:\n\u2502 ${PREFIX}resetwarn @user\n\u2502 ${PREFIX}resetwarn <number>\n\u2502 Reply to a message with ${PREFIX}resetwarn\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const warnings = loadWarnings();
    if (warnings[jid]?.users?.[targetUser]) {
      warnings[jid].users[targetUser] = 0;
      saveWarnings(warnings);
    }

    await sock.sendMessage(jid, {
      text: `\u250c\u2500\u29ed RESET WARN \u29ed\u2500\u2510\n\u2502 Warnings reset for @${targetUser.split('@')[0]}.\n\u2502 Warnings: 0\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
      mentions: [targetUser]
    }, { quoted: msg });
  }
};

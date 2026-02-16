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
  name: 'warn',
  alias: ['addwarn'],
  description: 'Warn a user. Auto-kick after max warnings',
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
        text: `\u250c\u2500\u29ed WARN \u29ed\u2500\u2510\n\u2502 Usage:\n\u2502 ${PREFIX}warn @user\n\u2502 ${PREFIX}warn <number>\n\u2502 Reply to a message with ${PREFIX}warn\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const warnings = loadWarnings();
    if (!warnings[jid]) warnings[jid] = {};
    if (!warnings[jid].users) warnings[jid].users = {};

    const maxWarns = warnings[jid].maxWarns || 3;
    const currentWarns = (warnings[jid].users[targetUser] || 0) + 1;
    warnings[jid].users[targetUser] = currentWarns;
    saveWarnings(warnings);

    if (currentWarns >= maxWarns) {
      try {
        await sock.groupParticipantsUpdate(jid, [targetUser], 'remove');
        warnings[jid].users[targetUser] = 0;
        saveWarnings(warnings);

        await sock.sendMessage(jid, {
          text: `\u250c\u2500\u29ed WARNING - KICKED \u29ed\u2500\u2510\n\u2502 @${targetUser.split('@')[0]} has reached ${maxWarns}/${maxWarns} warnings.\n\u2502 User has been kicked from the group.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
          mentions: [targetUser]
        }, { quoted: msg });
      } catch (error) {
        await sock.sendMessage(jid, {
          text: '\u250c\u2500\u29ed ERROR \u29ed\u2500\u2510\n\u2502 User reached max warnings but failed to kick.\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518'
        }, { quoted: msg });
      }
    } else {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed WARNING \u29ed\u2500\u2510\n\u2502 @${targetUser.split('@')[0]} has been warned.\n\u2502 Warnings: ${currentWarns}/${maxWarns}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
        mentions: [targetUser]
      }, { quoted: msg });
    }
  }
};

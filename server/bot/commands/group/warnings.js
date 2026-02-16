import fs from 'fs';
import path from 'path';

const WARN_FILE = path.join(process.cwd(), 'server', 'bot', 'data', 'warnings.json');

function loadWarnings() {
  try { if (fs.existsSync(WARN_FILE)) return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8')); } catch {}
  return {};
}

function getTargetUser(msg, args) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentions?.length > 0) return mentions[0];
  if (msg.message?.extendedTextMessage?.contextInfo?.participant) return msg.message.extendedTextMessage.contextInfo.participant;
  if (args.length > 0) { const num = args[0].replace(/[^0-9]/g, ''); if (num.length > 8) return num + '@s.whatsapp.net'; }
  return null;
}

export default {
  name: 'warnings',
  alias: ['warnlist', 'checkwarn'],
  description: 'Check warnings for a user or list all warned users',
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

    const warnings = loadWarnings();
    const groupWarnings = warnings[jid];
    const maxWarns = groupWarnings?.maxWarns || 3;

    const targetUser = getTargetUser(msg, args);

    if (targetUser) {
      const count = groupWarnings?.users?.[targetUser] || 0;
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed WARNINGS \u29ed\u2500\u2510\n\u2502 User: @${targetUser.split('@')[0]}\n\u2502 Warnings: ${count}/${maxWarns}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
        mentions: [targetUser]
      }, { quoted: msg });
      return;
    }

    const users = groupWarnings?.users || {};
    const warnedUsers = Object.entries(users).filter(([, count]) => count > 0);

    if (warnedUsers.length === 0) {
      await sock.sendMessage(jid, {
        text: `\u250c\u2500\u29ed WARNINGS \u29ed\u2500\u2510\n\u2502 No warned users in this group.\n\u2502 Max warnings: ${maxWarns}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`
      }, { quoted: msg });
      return;
    }

    const list = warnedUsers.map(([user, count]) => `\u2502 @${user.split('@')[0]}: ${count}/${maxWarns}`).join('\n');
    const mentionList = warnedUsers.map(([user]) => user);

    await sock.sendMessage(jid, {
      text: `\u250c\u2500\u29ed WARNED USERS \u29ed\u2500\u2510\n${list}\n\u2502\n\u2502 Max warnings: ${maxWarns}\n\u2514\u2500\u29ed\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u29ed\u2500\u2518`,
      mentions: mentionList
    }, { quoted: msg });
  }
};

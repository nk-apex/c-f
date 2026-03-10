import { loadAutomod } from './automodStore.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

function cleanJid(jid) {
  if (!jid) return jid;
  const clean = jid.split(':')[0];
  return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

function getMessageType(msg) {
  const m = msg.message;
  if (!m) return null;
  if (m.videoMessage && !m.videoMessage.gifPlayback) return 'video';
  if (m.stickerMessage) return 'sticker';
  if (m.imageMessage) return 'image';
  if (m.audioMessage) return 'audio';
  if (m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension) return 'viewonce';
  return null;
}

function containsGroupLink(msg) {
  const m = msg.message;
  if (!m) return false;
  const text =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption || '';
  return /chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(text);
}

function hasMassMention(msg) {
  const m = msg.message;
  if (!m) return false;
  const mentions = m.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return mentions.length >= 5;
}

async function isAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const clean = cleanJid(userJid);
    const p = meta.participants.find(p => cleanJid(p.id) === clean);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch {
    return false;
  }
}

async function deleteMessage(sock, msg) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      delete: {
        id: msg.key.id,
        participant: msg.key.participant,
        remoteJid: msg.key.remoteJid,
        fromMe: false
      }
    });
  } catch {}
}

async function warn(sock, chatId, senderJid, reason) {
  try {
    const num = cleanJid(senderJid).split('@')[0];
    await sock.sendMessage(chatId, {
      text: `🚫 *Auto-Moderation*\n@${num} — ${reason}`,
      mentions: [cleanJid(senderJid)]
    });
  } catch {}
}

async function revealViewOnce(sock, msg, chatId, senderJid) {
  try {
    const m = msg.message;
    const inner =
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.viewOnceMessageV2Extension?.message;
    if (!inner) return;

    const num = cleanJid(senderJid).split('@')[0];
    const caption = `👁️ *Anti-View-Once*\n@${num} sent a view-once message — revealed below:`;

    const buffer = await downloadMediaMessage(
      { key: msg.key, message: inner },
      'buffer',
      {},
      { reuploadRequest: sock.updateMediaMessage }
    );

    if (inner.imageMessage) {
      await sock.sendMessage(chatId, {
        image: buffer,
        caption,
        mentions: [cleanJid(senderJid)]
      });
    } else if (inner.videoMessage) {
      await sock.sendMessage(chatId, {
        video: buffer,
        caption,
        mentions: [cleanJid(senderJid)]
      });
    } else if (inner.audioMessage) {
      await sock.sendMessage(chatId, {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        caption,
        mentions: [cleanJid(senderJid)]
      });
    }
  } catch {}
}

let enforcerAttached = false;

export function initAutomodEnforcer(sock) {
  if (enforcerAttached) return;
  enforcerAttached = true;

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        const chatId = msg.key.remoteJid;
        if (!chatId?.endsWith('@g.us')) continue;

        const data = loadAutomod();
        const settings = data[chatId] || {};
        if (!Object.values(settings).some(Boolean)) continue;

        const senderJid = msg.key.participant || chatId;
        const senderAdmin = await isAdmin(sock, chatId, senderJid);
        if (senderAdmin) continue;

        const msgType = getMessageType(msg);

        if (settings.antivideo && msgType === 'video') {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Videos are not allowed in this group.');
          continue;
        }

        if (settings.antisticker && msgType === 'sticker') {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Stickers are not allowed in this group.');
          continue;
        }

        if (settings.antiimage && msgType === 'image') {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Images are not allowed in this group.');
          continue;
        }

        if (settings.antiaudio && msgType === 'audio') {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Voice messages are not allowed in this group.');
          continue;
        }

        if (settings.antiviewonce && msgType === 'viewonce') {
          await revealViewOnce(sock, msg, chatId, senderJid);
          continue;
        }

        if (settings.antigrouplink && containsGroupLink(msg)) {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Group invite links are not allowed here.');
          continue;
        }

        if (settings.antimention && hasMassMention(msg)) {
          await deleteMessage(sock, msg);
          await warn(sock, chatId, senderJid, 'Mass mentions are not allowed in this group.');
          continue;
        }
      } catch {}
    }
  });

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      const data = loadAutomod();
      const settings = data[id] || {};

      if (settings.antileave && action === 'remove') {
        for (const p of participants) {
          const num = cleanJid(p).split('@')[0];
          await sock.sendMessage(id, {
            text: `⚠️ *Anti-Leave Alert*\n@${num} has left the group. Admins have been notified.`,
            mentions: [cleanJid(p)]
          });
        }
      }
    } catch {}
  });

  console.log('✅ Automod enforcer initialized');
}

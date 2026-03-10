import { setEnabled, isEnabled } from '../../lib/automodStore.js';

let callListenerAttached = false;

export function initAntiGroupCallListener(sock) {
  if (callListenerAttached) return;
  callListenerAttached = true;
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      try {
        const fromJid = call.from || '';
        const isGroupCall = fromJid.endsWith('@g.us') || call.isGroup === true;
        if (!isGroupCall) continue;
        if (isEnabled(fromJid, 'antigroupcall')) {
          await sock.rejectCall(call.id, call.from);
        }
      } catch {}
    }
  });
}

export default {
  name: 'antigroupcall',
  alias: ['nogroupcall', 'rejectgroupcall'],
  description: 'Auto-reject incoming group calls',
  category: 'group',
  usage: '.antigroupcall on/off',

  async execute(sock, msg, args, PREFIX) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us'))
      return sock.sendMessage(jid, { text: '❌ This command only works in groups.' }, { quoted: msg });

    const sender = msg.key.participant || jid;
    const meta = await sock.groupMetadata(jid);
    const p = meta.participants.find(x => x.id === sender);
    if (!p?.admin)
      return sock.sendMessage(jid, { text: '❌ Only admins can use this command.' }, { quoted: msg });

    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      setEnabled(jid, 'antigroupcall', true);
      initAntiGroupCallListener(sock);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 📵 *ANTI-GROUP-CALL*\n├◆ Status: ✅ ON\n├◆ Incoming group calls will be rejected.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antigroupcall', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 📵 *ANTI-GROUP-CALL*\n├◆ Status: ❌ OFF\n├◆ Group calls are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antigroupcall') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 📵 *ANTI-GROUP-CALL*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antigroupcall on/off\n└─⧭`
    }, { quoted: msg });
  }
};

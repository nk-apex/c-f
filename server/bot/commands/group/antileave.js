import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antileave',
  alias: ['noleave'],
  description: 'Alert admins when a member leaves the group',
  category: 'group',
  usage: '.antileave on/off',

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
      setEnabled(jid, 'antileave', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🚪 *ANTI-LEAVE*\n├◆ Status: ✅ ON\n├◆ Admins will be alerted when members leave.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antileave', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🚪 *ANTI-LEAVE*\n├◆ Status: ❌ OFF\n├◆ Leave alerts are disabled.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antileave') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🚪 *ANTI-LEAVE*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antileave on/off\n└─⧭`
    }, { quoted: msg });
  }
};

import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antivideo',
  alias: ['novideo'],
  description: 'Auto-delete videos sent by non-admins in the group',
  category: 'group',
  usage: '.antivideo on/off',

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
      setEnabled(jid, 'antivideo', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🎬 *ANTI-VIDEO*\n├◆ Status: ✅ ON\n├◆ Videos from non-admins will be deleted.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antivideo', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🎬 *ANTI-VIDEO*\n├◆ Status: ❌ OFF\n├◆ Videos are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antivideo') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🎬 *ANTI-VIDEO*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antivideo on/off\n└─⧭`
    }, { quoted: msg });
  }
};

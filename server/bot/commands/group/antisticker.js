import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antisticker',
  alias: ['nosticker'],
  description: 'Auto-delete stickers sent by non-admins in the group',
  category: 'group',
  usage: '.antisticker on/off',

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
      setEnabled(jid, 'antisticker', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🚫 *ANTI-STICKER*\n├◆ Status: ✅ ON\n├◆ Stickers from non-admins will be deleted.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antisticker', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🚫 *ANTI-STICKER*\n├◆ Status: ❌ OFF\n├◆ Stickers are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antisticker') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🚫 *ANTI-STICKER*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antisticker on/off\n└─⧭`
    }, { quoted: msg });
  }
};

import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antiaudio',
  alias: ['noaudio', 'novoice'],
  description: 'Auto-delete voice messages sent by non-admins in the group',
  category: 'group',
  usage: '.antiaudio on/off',

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
      setEnabled(jid, 'antiaudio', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🔇 *ANTI-AUDIO*\n├◆ Status: ✅ ON\n├◆ Voice messages from non-admins will be deleted.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antiaudio', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🔇 *ANTI-AUDIO*\n├◆ Status: ❌ OFF\n├◆ Voice messages are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antiaudio') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🔇 *ANTI-AUDIO*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antiaudio on/off\n└─⧭`
    }, { quoted: msg });
  }
};

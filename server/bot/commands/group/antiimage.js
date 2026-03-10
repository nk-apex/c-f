import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antiimage',
  alias: ['noimage'],
  description: 'Auto-delete images sent by non-admins in the group',
  category: 'group',
  usage: '.antiimage on/off',

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
      setEnabled(jid, 'antiimage', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🖼️ *ANTI-IMAGE*\n├◆ Status: ✅ ON\n├◆ Images from non-admins will be deleted.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antiimage', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🖼️ *ANTI-IMAGE*\n├◆ Status: ❌ OFF\n├◆ Images are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antiimage') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🖼️ *ANTI-IMAGE*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antiimage on/off\n└─⧭`
    }, { quoted: msg });
  }
};

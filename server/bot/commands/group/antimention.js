import { setEnabled, isEnabled } from '../../lib/automodStore.js';

export default {
  name: 'antimention',
  alias: ['nomention', 'antitag'],
  description: 'Auto-delete mass @mentions (5+) sent by non-admins in the group',
  category: 'group',
  usage: '.antimention on/off',

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
      setEnabled(jid, 'antimention', true);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🔕 *ANTI-MENTION*\n├◆ Status: ✅ ON\n├◆ Mass @mentions (5+) from non-admins will be deleted.\n└─⧭`
      }, { quoted: msg });
    }

    if (action === 'off') {
      setEnabled(jid, 'antimention', false);
      return sock.sendMessage(jid, {
        text: `┌─⧭ 🔕 *ANTI-MENTION*\n├◆ Status: ❌ OFF\n├◆ Mentions are now allowed.\n└─⧭`
      }, { quoted: msg });
    }

    const current = isEnabled(jid, 'antimention') ? '✅ ON' : '❌ OFF';
    return sock.sendMessage(jid, {
      text: `┌─⧭ 🔕 *ANTI-MENTION*\n├◆ Current: ${current}\n├◆ Usage: ${PREFIX}antimention on/off\n└─⧭`
    }, { quoted: msg });
  }
};

import fs from 'fs';
import path from 'path';

const AUTOMOD_FILE = path.join(process.cwd(), 'server', 'bot', 'data', 'automod.json');

function loadAutomod() {
  try { if (fs.existsSync(AUTOMOD_FILE)) return JSON.parse(fs.readFileSync(AUTOMOD_FILE, 'utf-8')); } catch {} return {};
}

function saveAutomod(data) {
  const dir = path.dirname(AUTOMOD_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(AUTOMOD_FILE, JSON.stringify(data, null, 2));
}

export default {
  name: 'antivideo',
  alias: ['novideo', 'novid'],
  description: 'Toggle anti-video auto-moderation for the group',
  category: 'group',
  ownerOnly: false,

  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
    }
    const sender = msg.key.participant || jid;
    const groupMetadata = await sock.groupMetadata(jid);
    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
    if (!senderParticipant?.admin) {
      return sock.sendMessage(jid, { text: '┌─⧭ ADMIN ONLY ⧭─┐\n│ Only admins can use this command.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
    }
    const action = args[0]?.toLowerCase();
    const data = loadAutomod();
    if (!data[jid]) data[jid] = {};
    if (action === 'on') {
      data[jid]['antivideo'] = true;
      saveAutomod(data);
      return sock.sendMessage(jid, { text: '┌─⧭ ANTI-VIDEO ⧭─┐\n│ Enabled successfully.\n│ Status: ON\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
    } else if (action === 'off') {
      data[jid]['antivideo'] = false;
      saveAutomod(data);
      return sock.sendMessage(jid, { text: '┌─⧭ ANTI-VIDEO ⧭─┐\n│ Disabled successfully.\n│ Status: OFF\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
    } else {
      const current = data[jid]['antivideo'] ? 'ON' : 'OFF';
      return sock.sendMessage(jid, { text: `┌─⧭ ANTI-VIDEO ⧭─┐\n│ Current: ${current}\n│ Usage: ${PREFIX}antivideo on/off\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘` }, { quoted: msg });
    }
  }
};

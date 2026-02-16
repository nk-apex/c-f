import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'server', 'bot', 'data', 'stickerpack.json');

function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch {}
    return {};
}

function writeData(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export default {
    name: 'stickerpack',
    alias: ['packsticker', 'stkpack'],
    category: 'group',
    description: 'Set sticker pack name for the group',
    ownerOnly: false,

    async execute(sock, msg, args, PREFIX, extra) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '┌─⧭ GROUP ONLY ⧭─┐\n│ This command works in groups only.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        const data = readData();

        if (!args[0]) {
            const currentPack = data[jid] || 'Not set';
            let text = '┌─⧭ STICKER PACK ⧭─┐\n';
            text += `│ Current pack name: ${currentPack}\n`;
            text += '│\n';
            text += `│ Usage: ${PREFIX}stickerpack <name>\n`;
            text += `│ Example: ${PREFIX}stickerpack MyGroup\n`;
            text += '│\n';
            text += `│ Use "${PREFIX}stickerpack reset" to remove.\n`;
            text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        const packName = args.join(' ');

        if (packName.toLowerCase() === 'reset') {
            delete data[jid];
            writeData(data);

            return sock.sendMessage(jid, { text: '┌─⧭ STICKER PACK ⧭─┐\n│ Sticker pack name has been reset.\n└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘' }, { quoted: msg });
        }

        data[jid] = packName;
        writeData(data);

        let text = '┌─⧭ STICKER PACK UPDATED ⧭─┐\n';
        text += `│ Pack name set to: ${packName}\n`;
        text += '│\n';
        text += '│ New stickers will use this name.\n';
        text += '└─⧭━━━━━━━━━━━━━━━━━━━━━━━━━━⧭─┘';

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};

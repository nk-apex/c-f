// commands/tools/qr.js
export default {
  name: "qr",
  alias: ["qrcode"],
  description: "Generate QR codes from text/URL 📱",
  category: "tools",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `📱 *FOXY QR GENERATOR*\n\n` +
              `*Usage:*\n` +
              `${PREFIX}qr https://example.com\n` +
              `${PREFIX}qr hello world\n` +
              `${PREFIX}qr wifi MyNetwork mypassword\n\n` +
              `*Examples:*\n` +
              `${PREFIX}qr https://github.com\n` +
              `${PREFIX}qr Contact: 1234567890`
      }, { quoted: m });
    }
    
    try {
      const text = args.join(' ');
      
      // Handle WiFi QR
      if (args[0].toLowerCase() === 'wifi') {
        const ssid = args[1] || 'MyWiFi';
        const password = args[2] || '';
        const qrText = `WIFI:S:${ssid};T:WPA;P:${password};;`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrText)}`;
        
        return sock.sendMessage(jid, {
          image: { url: qrUrl },
          caption: `📱 *FOXY WiFi QR*\n\n` +
                   `*SSID:* ${ssid}\n` +
                   `*Password:* ${password || 'Open Network'}\n\n` +
                   `Scan to connect to WiFi`
        }, { quoted: m });
      }
      
      // Regular QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
      
      await sock.sendMessage(jid, {
        image: { url: qrUrl },
        caption: `📱 *FOXY QR CODE*\n\n` +
                 `*Content:* ${text}\n\n` +
                 `Scan the QR code above`
      }, { quoted: m });
      
    } catch (error) {
      await sock.sendMessage(jid, {
        text: `❌ *Failed to generate QR code!*`
      }, { quoted: m });
    }
  }
};
// commands/tools/ping.js
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'ping',
    alias: ['pong', 'speed', 'latency'],
    category: 'tools',
    description: 'Check bot response time',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'ping')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const start = Date.now();
        
        // Send "Pinging..." message first
        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `🏓 *Pinging...* 🦊`
        });
        
        const end = Date.now();
        const latency = end - start;
        
        // Edit the message to show PONG! with response time
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🏓 *PONG!*\n` +
                  `*Response Time:* ${latency}ms ok I'm active now what..are you using me or what? 🦊\n` +
                  `🦊`,
            edit: sentMsg.key
        });
    }
};
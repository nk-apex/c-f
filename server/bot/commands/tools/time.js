export default {
    name: 'time',
    alias: ['clock', 'now', 'datetime'],
    category: 'tools',
    description: 'Get live current time anywhere - Leon\'s Time Network 😎',
    
    async execute(sock, msg, args, prefix) {
        const jid = msg.key.remoteJid;
        
        // Quick help if no args
        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `🕐 *Leon's Live Time*\nUse: ${prefix}time <place>\nEx: ${prefix}time Berlin\n    ${prefix}time EST\n    ${prefix}time Fox Forest\n    ${prefix}time list`,
                quoted: msg
            });
        }

        const loadingMsg = await sock.sendMessage(jid, {
            text: `🦊 Scanning Leon's Time Network for ${args.join(' ')}...`,
            quoted: msg
        });

        try {
            const input = args.join(' ').toLowerCase();
            
            // Show timezone list
            if (input === 'list') {
                return await sock.sendMessage(jid, {
                    text: `🌍 *Leon's Time Zones*\n\n🇺🇸 Americas:\n• EST - Eastern (New York)\n• CST - Central (Chicago)\n• MST - Mountain (Denver)\n• PST - Pacific (LA)\n\n🇪🇺 Europe:\n• GMT - London\n• CET - Paris/Berlin\n\n🇦🇺 Australia:\n• AEST - Sydney\n\n🇦🇸 Asia:\n• IST - India\n• JST - Japan\n• CST - China\n• KST - Korea\n\n😎 Special:\n• Fox Forest 🦊\n• Leon's Den\n\nUse: ${prefix}time <name>`,
                    edit: loadingMsg.key
                });
            }
            
            // Leon's Time Network Database with real time calculations
            const leonTimeZones = {
                // Major Cities with their UTC offsets
                'berlin': { offset: 1, name: 'Berlin', emoji: '🇩🇪', zone: 'CET' },
                'london': { offset: 0, name: 'London', emoji: '🇬🇧', zone: 'GMT' },
                'new york': { offset: -5, name: 'New York', emoji: '🇺🇸', zone: 'EST' },
                'tokyo': { offset: 9, name: 'Tokyo', emoji: '🇯🇵', zone: 'JST' },
                'paris': { offset: 1, name: 'Paris', emoji: '🇫🇷', zone: 'CET' },
                'sydney': { offset: 11, name: 'Sydney', emoji: '🇦🇺', zone: 'AEDT' },
                'dubai': { offset: 4, name: 'Dubai', emoji: '🇦🇪', zone: 'GST' },
                'moscow': { offset: 3, name: 'Moscow', emoji: '🇷🇺', zone: 'MSK' },
                'singapore': { offset: 8, name: 'Singapore', emoji: '🇸🇬', zone: 'SGT' },
                'beijing': { offset: 8, name: 'Beijing', emoji: '🇨🇳', zone: 'CST' },
                'delhi': { offset: 5.5, name: 'Delhi', emoji: '🇮🇳', zone: 'IST' },
                'cairo': { offset: 2, name: 'Cairo', emoji: '🇪🇬', zone: 'EET' },
                'rio': { offset: -3, name: 'Rio', emoji: '🇧🇷', zone: 'BRT' },
                
                // Time Zones
                'est': { offset: -5, name: 'Eastern Time', emoji: '🇺🇸', zone: 'EST' },
                'pst': { offset: -8, name: 'Pacific Time', emoji: '🇺🇸', zone: 'PST' },
                'cst': { offset: -6, name: 'Central Time', emoji: '🇺🇸', zone: 'CST' },
                'mst': { offset: -7, name: 'Mountain Time', emoji: '🇺🇸', zone: 'MST' },
                'gmt': { offset: 0, name: 'London', emoji: '🇬🇧', zone: 'GMT' },
                'cet': { offset: 1, name: 'Central Europe', emoji: '🇪🇺', zone: 'CET' },
                'ist': { offset: 5.5, name: 'India', emoji: '🇮🇳', zone: 'IST' },
                'jst': { offset: 9, name: 'Japan', emoji: '🇯🇵', zone: 'JST' },
                'aest': { offset: 10, name: 'Sydney', emoji: '🇦🇺', zone: 'AEST' },
                
                // Leon's Special Places (fun offsets)
                'fox forest': { offset: 1, name: 'Fox Forest', emoji: '🦊', zone: 'FXT' },
                'leon\'s den': { offset: 0, name: 'Leon\'s Den', emoji: '😎', zone: 'LDT' },
                'bot hq': { offset: 0, name: 'Bot HQ', emoji: '⚡', zone: 'BOT' },
                'digital realm': { offset: 0, name: 'Digital Realm', emoji: '💻', zone: 'UTC' },
            };
            
            // Find the timezone
            let timezone = null;
            let locationName = '';
            
            for (const [key, data] of Object.entries(leonTimeZones)) {
                if (input.includes(key) || key.includes(input)) {
                    timezone = data;
                    locationName = data.name;
                    break;
                }
            }
            
            // If not found, show error
            if (!timezone) {
                return await sock.sendMessage(jid, {
                    text: `❌ Timezone not found!\n\nTry: ${prefix}time Berlin\nOr: ${prefix}time EST\nOr: ${prefix}time list\n\nAvailable: Berlin, London, New York, Tokyo, EST, GMT, etc.`,
                    edit: loadingMsg.key
                });
            }
            
            // Calculate REAL current time based on UTC offset
            const now = new Date();
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
            const localTime = new Date(utcTime + (3600000 * timezone.offset));
            
            // Format the time
            const hours = localTime.getHours().toString().padStart(2, '0');
            const minutes = localTime.getMinutes().toString().padStart(2, '0');
            const seconds = localTime.getSeconds().toString().padStart(2, '0');
            
            const time24 = `${hours}:${minutes}:${seconds}`;
            const time12 = localTime.toLocaleTimeString('en-US', {
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get date
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const day = days[localTime.getDay()];
            const month = months[localTime.getMonth()];
            const date = localTime.getDate();
            const year = localTime.getFullYear();
            
            // Get time emoji
            let timeEmoji = '🕐';
            const hour = parseInt(hours);
            if (hour >= 5 && hour < 12) timeEmoji = '🌅';
            else if (hour >= 12 && hour < 17) timeEmoji = '☀️';
            else if (hour >= 17 && hour < 21) timeEmoji = '🌇';
            else timeEmoji = '🌙';
            
            // Format offset string
            const offsetStr = timezone.offset >= 0 ? `+${timezone.offset}` : timezone.offset.toString();
            
            // Create message - SHORT VERSION
            const message = `
${timezone.emoji} *${locationName.toUpperCase()}*
${timeEmoji} ${time12} (${time24})

📅 ${day}, ${date} ${month} ${year}
🌐 UTC${offsetStr} (${timezone.zone})

🦊 *Leon's Live Time Network* 😎
            `.trim();
            
            await sock.sendMessage(jid, {
                text: message,
                edit: loadingMsg.key
            });
            
        } catch (error) {
            console.error('Time error:', error);
            
            await sock.sendMessage(jid, {
                text: `❌ Time sync failed!\n\nTry: ${prefix}time Berlin\nOr check: ${prefix}time list`,
                edit: loadingMsg.key
            });
        }
    }
};
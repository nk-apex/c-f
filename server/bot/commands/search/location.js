// Alternative simpler version: commands/simpleloc.js
export default {
  name: 'loc',
  description: 'Quick location sender',
  category: 'utility',
  aliases: ['location', 'map'],
  
  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;
    
    if (args.length === 0) {
      return sock.sendMessage(jid, {
        text: `📍 Usage: ${PREFIX}loc [place]\nExample: ${PREFIX}loc Empire State Building`
      }, { quoted: m });
    }
    
    const place = args.join(' ');
    
    // Send a predefined location (you can change these)
    const locations = {
      'new york': { lat: 40.7128, lon: -74.0060, name: 'New York City' },
      'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
      'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
      'delhi': { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
      'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
      'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
      'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
      'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
      'hong kong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong' }
    };
    
    const query = place.toLowerCase();
    let location = null;
    
    // Check if it's a predefined location
    for (const [key, loc] of Object.entries(locations)) {
      if (query.includes(key)) {
        location = loc;
        break;
      }
    }
    
    if (location) {
      await sock.sendMessage(jid, {
        location: {
          degreesLatitude: location.lat,
          degreesLongitude: location.lon,
          name: location.name
        }
      });
      
      await sock.sendMessage(jid, {
        text: `📍 ${location.name}\nLat: ${location.lat}\nLon: ${location.lon}\n\nOpen in Maps: https://maps.google.com/?q=${location.lat},${location.lon}`
      }, { quoted: m });
    } else {
      // If not predefined, send a generic location
      await sock.sendMessage(jid, {
        location: {
          degreesLatitude: 0,
          degreesLongitude: 0,
          name: 'Location Search'
        }
      });
      
      await sock.sendMessage(jid, {
        text: `📍 *Location Search*\n\nFor "${place}", use the detailed location command:\n${PREFIX}location ${place}\n\nOr try these predefined locations:\n${Object.keys(locations).join(', ')}`
      }, { quoted: m });
    }
  }
};
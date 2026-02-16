// commands/media/wallpaper.js
export default {
  name: "wallpaper",
  alias: ["wall", "wp", "background", "wallpapers"],
  description: "Get beautiful wallpapers for your device 🖼️",
  category: "media",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    // Your Unsplash Access Key
    const UNSPLASH_ACCESS_KEY = 'rC69KjCifd7vgF5GQv4OsW7pcgT71aWV4UJ22WbojEQ';
    
    // Wallpaper categories
    const categories = {
      "anime": ["anime", "animu", "animewall"],
      "nature": ["nature", "forest", "mountain", "landscape"],
      "abstract": ["abstract", "art", "pattern"],
      "minimal": ["minimal", "simple", "clean"],
      "dark": ["dark", "black", "darkmode"],
      "cars": ["cars", "automotive", "supercars"],
      "space": ["space", "galaxy", "stars", "universe"],
      "animals": ["animals", "wildlife", "cats", "dogs"],
      "gaming": ["gaming", "games", "esports"],
      "quotes": ["quotes", "inspirational", "motivational"],
      "cyberpunk": ["cyberpunk", "neon", "futuristic"],
      "random": ["random", "any", "mix"]
    };
    
    if (args.length === 0 || args[0] === 'help') {
      const categoryList = Object.keys(categories).map(cat => 
        `• *${cat}* - ${categories[cat].slice(0, 3).join(', ')}`
      ).join('\n');
      
      return sock.sendMessage(jid, {
        text: `🦊 *FOXY WALLPAPER* 🖼️\n\n` +
              `*Usage:*\n` +
              `${PREFIX}wallpaper anime\n` +
              `${PREFIX}wall nature 5\n` +
              `${PREFIX}wallpaper random\n\n` +
              `*Available Categories:*\n${categoryList}\n\n` +
              `*Options:*\n` +
              `• Add a number to get multiple wallpapers (max 10)\n` +
              `• Example: ${PREFIX}wallpaper nature 3\n` +
              `• ${PREFIX}wallpaper categories - Show all categories`
      }, { quoted: m });
    }
    
    if (args[0].toLowerCase() === 'categories') {
      const allCats = Object.keys(categories).join(', ');
      return sock.sendMessage(jid, {
        text: `📁 *ALL WALLPAPER CATEGORIES*\n\n${allCats}\n\n` +
              `💡 Use: ${PREFIX}wallpaper <category>`
      }, { quoted: m });
    }
    
    try {
      let category = args[0].toLowerCase();
      let count = 1;
      
      if (args.length > 1 && !isNaN(args[1]) && parseInt(args[1]) > 0) {
        count = parseInt(args[1]);
        if (count > 10) count = 10;
      }
      
      let actualCategory = "random";
      for (const [key, aliases] of Object.entries(categories)) {
        if (aliases.includes(category) || key === category) {
          actualCategory = key;
          break;
        }
      }
      
      await sock.sendMessage(jid, {
        text: `🦊 *Searching ${actualCategory} wallpapers...* 🖼️`
      }, { quoted: m });
      
      let wallpapers = [];
      
      try {
        wallpapers = await fetchFromUnsplash(actualCategory, count, UNSPLASH_ACCESS_KEY);
      } catch (error) {
        wallpapers = await fetchRandomWallpapers(count);
      }
      
      if (wallpapers.length === 0) {
        throw new Error("No wallpapers found");
      }
      
      for (let i = 0; i < Math.min(wallpapers.length, count); i++) {
        const wallpaper = wallpapers[i];
        
        await sock.sendMessage(jid, {
          image: { url: wallpaper.url },
          caption: `🦊 *FOXY WALLPAPER*\n\n` +
                   `*Category:* ${actualCategory.toUpperCase()}\n` +
                   `*Resolution:* ${wallpaper.width || 'Unknown'}x${wallpaper.height || 'Unknown'}\n` +
                   `*Source:* ${wallpaper.source || 'Unknown'}\n\n` +
                   `📁 ${i + 1}/${Math.min(wallpapers.length, count)}`
        }, { quoted: i === 0 ? m : null });
        
        if (count > 1 && i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error) {
      console.error("Wallpaper error:", error);
      
      await sock.sendMessage(jid, {
        text: `❌ *Failed to fetch wallpapers!*\n\n` +
              `Try: ${PREFIX}wallpaper categories\n` +
              `Or: ${PREFIX}wallpaper random`
      }, { quoted: m });
    }
  }
};

async function fetchFromUnsplash(category, count, accessKey) {
  const query = category === 'random' ? '' : category;
  const response = await fetch(
    `https://api.unsplash.com/photos/random?query=${query}&count=${count}&orientation=landscape&client_id=${accessKey}`
  );
  
  if (!response.ok) throw new Error('Unsplash API failed');
  
  const data = await response.json();
  const items = Array.isArray(data) ? data : [data];
  
  return items.map(photo => ({
    url: photo.urls.regular,
    downloadUrl: photo.links.download,
    width: photo.width,
    height: photo.height,
    source: 'Unsplash',
    author: photo.user.name
  }));
}

async function fetchRandomWallpapers(count) {
  try {
    const response = await fetch(`https://picsum.photos/v2/list?page=1&limit=${count}`);
    if (response.ok) {
      const data = await response.json();
      return data.map(img => ({
        url: `https://picsum.photos/id/${img.id}/1920/1080`,
        downloadUrl: img.download_url,
        width: 1920,
        height: 1080,
        source: 'Picsum',
        author: img.author
      }));
    }
  } catch (error) {}
  
  return [{
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
    downloadUrl: 'https://unsplash.com/photos/mountains',
    width: 1920,
    height: 1080,
    source: 'Fallback',
    author: 'Unknown'
  }];
}
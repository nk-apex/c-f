export default {
  name: "wallpaper",
  alias: ["wall", "wp", "background", "wallpapers"],
  description: "Get beautiful wallpapers for your device",
  category: "media",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const UNSPLASH_ACCESS_KEY = 'rC69KjCifd7vgF5GQv4OsW7pcgT71aWV4UJ22WbojEQ';
    
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
        `\u2502 - ${cat}`
      ).join('\n');
      
      return sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Foxy Wallpaper*\n` +
              `\u2502\n` +
              `\u2502 Usage:\n` +
              `\u2502 ${PREFIX}wallpaper anime\n` +
              `\u2502 ${PREFIX}wall nature 5\n` +
              `\u2502 ${PREFIX}wallpaper random\n` +
              `\u2502\n` +
              `\u2502 Categories:\n` +
              `${categoryList}\n` +
              `\u2502\n` +
              `\u2502 Add number for multiple (max 10)\n` +
              `\u2502 Example: ${PREFIX}wallpaper nature 3\n` +
              `\u2514\u2500\u29ED`
      }, { quoted: m });
    }
    
    if (args[0].toLowerCase() === 'categories') {
      const allCats = Object.keys(categories).join(', ');
      return sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *All Wallpaper Categories*\n\u2502 ${allCats}\n\u2502\n\u2502 Use: ${PREFIX}wallpaper <category>\n\u2514\u2500\u29ED`
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
        text: `\u250C\u2500\u29ED *Searching...*\n\u2502 Finding ${actualCategory} wallpapers...\n\u2514\u2500\u29ED`
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
          caption: `\u250C\u2500\u29ED *Foxy Wallpaper*\n` +
                   `\u2502 Category: ${actualCategory.toUpperCase()}\n` +
                   `\u2502 Resolution: ${wallpaper.width || 'Unknown'}x${wallpaper.height || 'Unknown'}\n` +
                   `\u2502 Source: ${wallpaper.source || 'Unknown'}\n` +
                   `\u2502 ${i + 1}/${Math.min(wallpapers.length, count)}\n` +
                   `\u2514\u2500\u29ED`
        }, { quoted: i === 0 ? m : null });
        
        if (count > 1 && i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error) {
      console.error("Wallpaper error:", error);
      
      await sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *Error*\n` +
              `\u2502 Failed to fetch wallpapers!\n` +
              `\u2502 Try: ${PREFIX}wallpaper categories\n` +
              `\u2502 Or: ${PREFIX}wallpaper random\n` +
              `\u2514\u2500\u29ED`
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
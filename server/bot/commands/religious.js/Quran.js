// commands/religious/quran.js
export default {
  name: "quran",
  alias: ["surah", "ayat", "alquran"],
  description: "Get Quran verses from any surah 📖🕋",
  category: "religious",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    // Quran surahs list
    const surahs = [
      { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", verses: 7 },
      { number: 2, name: "Al-Baqarah", arabic: "البقرة", verses: 286 },
      { number: 3, name: "Ali 'Imran", arabic: "آل عمران", verses: 200 },
      { number: 4, name: "An-Nisa", arabic: "النساء", verses: 176 },
      { number: 5, name: "Al-Ma'idah", arabic: "المائدة", verses: 120 },
      { number: 6, name: "Al-An'am", arabic: "الأنعام", verses: 165 },
      { number: 7, name: "Al-A'raf", arabic: "الأعراف", verses: 206 },
      { number: 8, name: "Al-Anfal", arabic: "الأنفال", verses: 75 },
      { number: 9, name: "At-Taubah", arabic: "التوبة", verses: 129 },
      { number: 10, name: "Yunus", arabic: "يونس", verses: 109 },
      { number: 11, name: "Hud", arabic: "هود", verses: 123 },
      { number: 12, name: "Yusuf", arabic: "يوسف", verses: 111 },
      { number: 13, name: "Ar-Ra'd", arabic: "الرعد", verses: 43 },
      { number: 14, name: "Ibrahim", arabic: "ابراهيم", verses: 52 },
      { number: 15, name: "Al-Hijr", arabic: "الحجر", verses: 99 },
      { number: 16, name: "An-Nahl", arabic: "النحل", verses: 128 },
      { number: 17, name: "Al-Isra", arabic: "الإسراء", verses: 111 },
      { number: 18, name: "Al-Kahf", arabic: "الكهف", verses: 110 },
      { number: 19, name: "Maryam", arabic: "مريم", verses: 98 },
      { number: 20, name: "Taha", arabic: "طه", verses: 135 },
      // ... Add all 114 surahs
    ];
    
    if (args.length === 0) {
      // Show first 20 surahs
      const surahList = surahs.slice(0, 20).map(s => 
        `${s.number}. ${s.name} (${s.arabic})`
      ).join('\n');
      
      return sock.sendMessage(jid, {
        text: `🦊 *FOX QURAN SEARCH* 📖\n\n` +
              `*Usage:*\n` +
              `${PREFIX}quran 1:1-7\n` +
              `${PREFIX}quran al-fatihah\n` +
              `${PREFIX}quran random\n` +
              `${PREFIX}quran list\n\n` +
              `*First 20 Surahs:*\n${surahList}\n\n` +
              `✨ *Example:* ${PREFIX}quran 2:255 (Ayatul Kursi)`
      }, { quoted: m });
    }
    
    try {
      // Handle list command
      if (args[0].toLowerCase() === 'list') {
        let response = "🦊 *ALL QURAN SURAHS* 📖\n\n";
        for (let i = 0; i < surahs.length; i += 4) {
          const chunk = surahs.slice(i, i + 4);
          response += chunk.map(s => 
            `${s.number.toString().padStart(3, '0')}. ${s.name}`
          ).join(' | ') + '\n';
        }
        return sock.sendMessage(jid, { text: response }, { quoted: m });
      }
      
      let surahNum, verseNum;
      
      // Handle random verse
      if (args[0].toLowerCase() === 'random') {
        const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
        const randomVerse = Math.floor(Math.random() * randomSurah.verses) + 1;
        surahNum = randomSurah.number;
        verseNum = randomVerse;
      } else {
        // Parse reference
        const ref = args.join(' ');
        const match = ref.match(/(\d+):(\d+)/);
        
        if (match) {
          surahNum = parseInt(match[1]);
          verseNum = parseInt(match[2]);
        } else {
          // Try to find by name
          const searchName = args.join(' ').toLowerCase();
          const foundSurah = surahs.find(s => 
            s.name.toLowerCase().includes(searchName) ||
            s.arabic.includes(searchName)
          );
          
          if (!foundSurah) {
            return sock.sendMessage(jid, {
              text: `❌ *Surah not found!*\n\nUse number (1:1) or name (al-fatihah)`
            }, { quoted: m });
          }
          
          surahNum = foundSurah.number;
          verseNum = 1; // Default to first verse
        }
      }
      
      // Validate surah number
      if (surahNum < 1 || surahNum > 114) {
        return sock.sendMessage(jid, {
          text: "❌ *Invalid surah!*\n\nQuran has 114 surahs (1-114)"
        }, { quoted: m });
      }
      
      const surah = surahs.find(s => s.number === surahNum);
      
      // Validate verse number
      if (verseNum < 1 || verseNum > surah.verses) {
        return sock.sendMessage(jid, {
          text: `❌ *Invalid verse!*\n\n${surah.name} has ${surah.verses} verses`
        }, { quoted: m });
      }
      
      // Show searching
      await sock.sendMessage(jid, {
        text: `🦊 *Searching Quran...* 📖\n\nSurah ${surah.name} (${surah.arabic})\nVerse ${verseNum}`
      }, { quoted: m });
      
      // Fetch from Quran API
      const url = `https://api.alquran.cloud/v1/ayah/${surahNum}:${verseNum}/editions/quran-uthmani,en.sahih`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code !== 200) {
        return sock.sendMessage(jid, {
          text: `❌ *Verse not found!*\n\nSurah ${surahNum}:${verseNum}`
        }, { quoted: m });
      }
      
      const arabicText = data.data[0].text;
      const englishText = data.data[1].text;
      
      // Send verse
      await sock.sendMessage(jid, {
        text: `📖 *QURAN VERSE* 🦊\n\n` +
              `*Surah ${surah.name} (${surah.arabic})*\n` +
              `*Verse ${verseNum} of ${surah.verses}*\n\n` +
              `🕋 *Arabic:*\n${arabicText}\n\n` +
              `🌍 *Translation:*\n${englishText}\n\n` +
              `*Surah Number:* ${surahNum}\n` +
              `*Total Verses:* ${surah.verses}\n` +
              `*Revelation:* ${surahNum <= 86 ? 'Makki' : 'Madani'}\n\n` +
              `✨ *Fox Blessing:* May this ayah bring you peace! 🕊️`
      });
      
    } catch (error) {
      console.error("Quran error:", error);
      
      await sock.sendMessage(jid, {
        text: `❌ *Quran Search Failed!* 🦊\n\n` +
              `*Popular Verses:*\n` +
              `• 1:1-7 (Al-Fatihah)\n` +
              `• 2:255 (Ayatul Kursi)\n` +
              `• 36:1-12 (Ya Sin)\n` +
              `• 55:1-13 (Ar-Rahman)\n` +
              `• 112:1-4 (Al-Ikhlas)\n\n` +
              `💡 *Try:* ${PREFIX}quran 1:1`
      }, { quoted: m });
    }
  }
};
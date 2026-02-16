// commands/religious/bible.js
export default {
  name: "bible",
  alias: ["verse", "scripture", "biblical"],
  description: "Get Bible verses from any book 📖✝️",
  category: "religious",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    // Bible books list
    const bibleBooks = {
      "genesis": "GEN", "exodus": "EXO", "leviticus": "LEV", "numbers": "NUM", "deuteronomy": "DEU",
      "joshua": "JOS", "judges": "JDG", "ruth": "RUT", "1samuel": "1SA", "2samuel": "2SA",
      "1kings": "1KI", "2kings": "2KI", "1chronicles": "1CH", "2chronicles": "2CH", "ezra": "EZR",
      "nehemiah": "NEH", "esther": "EST", "job": "JOB", "psalms": "PSA", "proverbs": "PRO",
      "ecclesiastes": "ECC", "songofsolomon": "SNG", "isaiah": "ISA", "jeremiah": "JER", "lamentations": "LAM",
      "ezekiel": "EZK", "daniel": "DAN", "hosea": "HOS", "joel": "JOL", "amos": "AMO",
      "obadiah": "OBA", "jonah": "JON", "micah": "MIC", "nahum": "NAH", "habakkuk": "HAB",
      "zephaniah": "ZEP", "haggai": "HAG", "zechariah": "ZEC", "malachi": "MAL",
      "matthew": "MAT", "mark": "MRK", "luke": "LUK", "john": "JHN", "acts": "ACT",
      "romans": "ROM", "1corinthians": "1CO", "2corinthians": "2CO", "galatians": "GAL", "ephesians": "EPH",
      "philippians": "PHP", "colossians": "COL", "1thessalonians": "1TH", "2thessalonians": "2TH",
      "1timothy": "1TI", "2timothy": "2TI", "titus": "TIT", "philemon": "PHM", "hebrews": "HEB",
      "james": "JAS", "1peter": "1PE", "2peter": "2PE", "1john": "1JN", "2john": "2JN",
      "3john": "3JN", "jude": "JUD", "revelation": "REV"
    };
    
    if (args.length === 0) {
      // Show all books
      const otBooks = Object.keys(bibleBooks).slice(0, 39).join(', ');
      const ntBooks = Object.keys(bibleBooks).slice(39).join(', ');
      
      return sock.sendMessage(jid, {
        text: `🦊 *FOX BIBLE SEARCH* 📖\n\n` +
              `*Usage:*\n` +
              `${PREFIX}bible john 3:16\n` +
              `${PREFIX}bible psalm 23\n` +
              `${PREFIX}bible random\n\n` +
              `*Old Testament (39 books):*\n${otBooks}\n\n` +
              `*New Testament (27 books):*\n${ntBooks}\n\n` +
              `✨ *Example:* ${PREFIX}bible genesis 1:1-3`
      }, { quoted: m });
    }
    
    try {
      let book, chapter, verse;
      
      // Handle random verse
      if (args[0].toLowerCase() === 'random') {
        const books = Object.keys(bibleBooks);
        const randomBook = books[Math.floor(Math.random() * books.length)];
        const randomChapter = Math.floor(Math.random() * 50) + 1;
        const randomVerse = Math.floor(Math.random() * 30) + 1;
        
        book = randomBook;
        chapter = randomChapter;
        verse = randomVerse;
      } else {
        // Parse reference
        const ref = args.join(' ');
        const match = ref.match(/(\d?[a-z]+)\s*(\d+):(\d+)(?:-(\d+))?/i);
        
        if (!match) {
          return sock.sendMessage(jid, {
            text: "❌ *Invalid format!*\n\nUse: book chapter:verse\nExample: john 3:16"
          }, { quoted: m });
        }
        
        book = match[1].toLowerCase();
        chapter = parseInt(match[2]);
        verse = parseInt(match[3]);
        const endVerse = match[4] ? parseInt(match[4]) : verse;
        
        // Check if book exists
        if (!bibleBooks[book]) {
          return sock.sendMessage(jid, {
            text: `❌ *Book not found!*\n\n"${book}" is not a valid Bible book.\nUse ${PREFIX}bible to see all books.`
          }, { quoted: m });
        }
      }
      
      // Show searching
      await sock.sendMessage(jid, {
        text: `🦊 *Searching Bible...be patient* 📖\n\n${book.charAt(0).toUpperCase() + book.slice(1)} ${chapter}:${verse}`
      }, { quoted: m });
      
      // Fetch from Bible API
      const bookCode = bibleBooks[book];
      const url = `https://bible-api.com/${bookCode}+${chapter}:${verse}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        return sock.sendMessage(jid, {
          text: `❌ *Verse not found!*\n\nCheck if the reference exists.\n${book} ${chapter}:${verse}`
        }, { quoted: m });
      }
      
      // Format verse
      const verseText = data.text.replace(/\n/g, ' ');
      const translation = data.translation_name || 'Unknown';
      
      // Send verse
      await sock.sendMessage(jid, {
        text: `📖 *BIBLE VERSE* 🦊\n\n` +
              `*${data.reference}*\n\n` +
              `${verseText}\n\n` +
              `*Translation:* ${translation}\n` +
              `*Book:* ${data.book_name}\n` +
              `*Chapter:* ${data.chapter}\n` +
              `*Verse:* ${data.verses[0].verse}\n\n` +
              `✨ *Fox Blessing:* May this word bless your day! 🙏`
      });
      
    } catch (error) {
      console.error("Bible error:", error);
      
      await sock.sendMessage(jid, {
        text: `❌ *Bible Search Failed!* 🦊\n\n` +
              `*Possible issues:*\n` +
              `• Invalid book/chapter/verse\n` +
              `• Network error\n` +
              `• API unavailable\n\n` +
              `💡 *Try:* Simple references like "john 3:16"`
      }, { quoted: m });
    }
  }
};
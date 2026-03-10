import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function truncateText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Extract metadata from HTML
function extractMetadata(html, url) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const metadata = {
      title: '',
      description: '',
      keywords: '',
      author: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      ogUrl: '',
      ogType: '',
      twitterCard: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonical: '',
      robots: '',
      viewport: '',
      charset: '',
      language: '',
      icons: [],
      scripts: [],
      stylesheets: [],
      images: [],
      links: []
    };
    
    // Basic meta tags
    metadata.title = doc.querySelector('title')?.textContent?.trim() || '';
    metadata.description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    metadata.keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';
    metadata.author = doc.querySelector('meta[name="author"]')?.getAttribute('content')?.trim() || '';
    metadata.robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim() || '';
    metadata.viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content')?.trim() || '';
    metadata.charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || 
                      doc.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content') || '';
    
    // Open Graph tags
    metadata.ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
    metadata.ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
    metadata.ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';
    metadata.ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content')?.trim() || '';
    metadata.ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content')?.trim() || '';
    
    // Twitter Cards
    metadata.twitterCard = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content')?.trim() || '';
    metadata.twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim() || '';
    metadata.twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content')?.trim() || '';
    metadata.twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content')?.trim() || '';
    
    // Canonical URL
    metadata.canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
    
    // Language
    metadata.language = doc.documentElement.getAttribute('lang') || '';
    
    // Icons - Convert NodeList to Array
    Array.from(doc.querySelectorAll('link[rel*="icon"]')).forEach(icon => {
      const href = icon.getAttribute('href');
      if (href) {
        try {
          const iconUrl = new URL(href, url).href;
          metadata.icons.push(iconUrl);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    // Scripts and styles - Convert NodeList to Array
    Array.from(doc.querySelectorAll('script[src]')).forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        try {
          metadata.scripts.push(new URL(src, url).href);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        try {
          metadata.stylesheets.push(new URL(href, url).href);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    // Images - Convert NodeList to Array and slice
    Array.from(doc.querySelectorAll('img[src]')).slice(0, 10).forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        try {
          const imgUrl = new URL(src, url).href;
          metadata.images.push({
            url: imgUrl,
            alt: img.getAttribute('alt') || '',
            width: img.getAttribute('width') || '',
            height: img.getAttribute('height') || ''
          });
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    // Links - Convert NodeList to Array and slice
    Array.from(doc.querySelectorAll('a[href]')).slice(0, 10).forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('//'))) {
        try {
          const linkUrl = href.startsWith('//') ? 'https:' + href : href;
          metadata.links.push({
            url: linkUrl,
            text: link.textContent?.trim()?.substring(0, 50) || '',
            title: link.getAttribute('title') || ''
          });
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    // Count elements - Convert NodeList to Array
    metadata.headings = {
      h1: doc.querySelectorAll('h1').length,
      h2: doc.querySelectorAll('h2').length,
      h3: doc.querySelectorAll('h3').length,
      h4: doc.querySelectorAll('h4').length,
      h5: doc.querySelectorAll('h5').length,
      h6: doc.querySelectorAll('h6').length
    };
    
    metadata.paragraphs = doc.querySelectorAll('p').length;
    metadata.linksCount = doc.querySelectorAll('a[href]').length;
    metadata.imagesCount = doc.querySelectorAll('img[src]').length;
    metadata.scriptsCount = doc.querySelectorAll('script').length;
    metadata.stylesheetsCount = doc.querySelectorAll('link[rel="stylesheet"]').length;
    
    return metadata;
  } catch (error) {
    console.error('Metadata extraction error:', error.message);
    // Return basic metadata structure on error
    return {
      title: '',
      description: '',
      keywords: '',
      author: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      ogUrl: '',
      ogType: '',
      twitterCard: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonical: '',
      robots: '',
      viewport: '',
      charset: '',
      language: '',
      icons: [],
      scripts: [],
      stylesheets: [],
      images: [],
      links: [],
      headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
      paragraphs: 0,
      linksCount: 0,
      imagesCount: 0,
      scriptsCount: 0,
      stylesheetsCount: 0
    };
  }
}

// Get security headers info
function analyzeSecurityHeaders(headers) {
  const security = {
    grade: 'A',
    issues: [],
    recommendations: []
  };
  
  const headerChecks = [
    { 
      name: 'Strict-Transport-Security', 
      required: true,
      message: 'Forces HTTPS connections',
      check: (value) => value && value.includes('max-age')
    },
    { 
      name: 'Content-Security-Policy', 
      required: true,
      message: 'Prevents XSS attacks',
      check: (value) => !!value
    },
    { 
      name: 'X-Frame-Options', 
      required: true,
      message: 'Prevents clickjacking',
      check: (value) => !!value
    },
    { 
      name: 'X-Content-Type-Options', 
      required: true,
      message: 'Prevents MIME sniffing',
      check: (value) => value === 'nosniff'
    },
    { 
      name: 'Referrer-Policy', 
      required: false,
      message: 'Controls referrer information',
      check: (value) => !!value
    },
    { 
      name: 'Permissions-Policy', 
      required: false,
      message: 'Controls browser features',
      check: (value) => !!value
    }
  ];
  
  let missingCount = 0;
  
  headerChecks.forEach(check => {
    const headerValue = headers.get(check.name);
    
    if (!headerValue && check.required) {
      security.issues.push(`Missing: ${check.name}`);
      missingCount++;
    } else if (headerValue && !check.check(headerValue)) {
      security.issues.push(`Weak: ${check.name} (${headerValue})`);
    }
  });
  
  // Grade calculation
  if (missingCount === 0) security.grade = 'A';
  else if (missingCount <= 2) security.grade = 'B';
  else if (missingCount <= 3) security.grade = 'C';
  else security.grade = 'D';
  
  return security;
}

// Get performance info
function analyzePerformance(startTime, contentLength, headers) {
  const loadTime = Date.now() - startTime;
  const size = contentLength ? parseInt(contentLength) : 0;
  
  return {
    loadTime: `${loadTime}ms`,
    size: formatBytes(size),
    grade: loadTime < 1000 ? 'A' : loadTime < 3000 ? 'B' : loadTime < 5000 ? 'C' : 'D',
    compression: headers.get('content-encoding') || 'None',
    cacheControl: headers.get('cache-control') || 'Not set',
    server: headers.get('server') || 'Unknown'
  };
}

// Format the inspection report
function formatInspectionReport(url, response, metadata, security, performance, html) {
  const report = [];
  
  // Header
  report.push(`🔍 *WEBSITE INSPECTION REPORT*`);
  report.push(`🌐 *URL:* \`${url}\``);
  report.push(`📡 *Status:* ${response.status} ${response.statusText}`);
  report.push(`🕒 *Inspected:* ${new Date().toLocaleString()}`);
  report.push(``);
  
  // Basic Info
  report.push(`📋 *BASIC INFORMATION*`);
  report.push(`├◆ Title: ${metadata.title || 'Not found'}`);
  report.push(`├◆ Description: ${truncateText(metadata.description, 100) || 'Not found'}`);
  report.push(`├◆ Language: ${metadata.language || 'Not specified'}`);
  report.push(`├◆ Charset: ${metadata.charset || 'Not specified'}`);
  report.push(`├◆ Viewport: ${metadata.viewport || 'Not specified'}`);
  report.push(`└─ Canonical: ${metadata.canonical || url}`);
  report.push(``);
  
  // SEO & Social Meta
  report.push(`🔎 *SEO & SOCIAL METADATA*`);
  if (metadata.ogTitle) report.push(`├◆ OG Title: ${truncateText(metadata.ogTitle, 80)}`);
  if (metadata.ogDescription) report.push(`├◆ OG Description: ${truncateText(metadata.ogDescription, 80)}`);
  if (metadata.ogImage) report.push(`├◆ OG Image: ${truncateText(metadata.ogImage, 60)}`);
  if (metadata.twitterTitle) report.push(`├◆ Twitter Title: ${truncateText(metadata.twitterTitle, 80)}`);
  if (metadata.twitterCard) report.push(`└─ Twitter Card: ${metadata.twitterCard}`);
  report.push(``);
  
  // Security
  report.push(`🛡️ *SECURITY ANALYSIS*`);
  report.push(`├◆ Grade: ${security.grade}`);
  if (security.issues.length > 0) {
    report.push(`├◆ Issues:`);
    security.issues.forEach(issue => report.push(`│  ⚠️ ${issue}`));
  } else {
    report.push(`├◆ Issues: None found ✅`);
  }
  report.push(`├◆ HTTPS: ${url.startsWith('https') ? 'Yes 🔒' : 'No ⚠️'}`);
  report.push(`└─ Content-Type: ${response.headers.get('content-type')?.split(';')[0] || 'Unknown'}`);
  report.push(``);
  
  // Performance
  report.push(`⚡ *PERFORMANCE*`);
  report.push(`├◆ Load Time: ${performance.loadTime}`);
  report.push(`├◆ Size: ${performance.size}`);
  report.push(`├◆ Grade: ${performance.grade}`);
  report.push(`├◆ Compression: ${performance.compression}`);
  report.push(`├◆ Cache: ${performance.cacheControl}`);
  report.push(`└─ Server: ${performance.server}`);
  report.push(``);
  
  // Content Analysis
  report.push(`📊 *CONTENT ANALYSIS*`);
  report.push(`├◆ Headings: H1(${metadata.headings.h1}) H2(${metadata.headings.h2}) H3(${metadata.headings.h3})`);
  report.push(`├◆ Paragraphs: ${metadata.paragraphs}`);
  report.push(`├◆ Images: ${metadata.imagesCount}`);
  report.push(`├◆ Links: ${metadata.linksCount}`);
  report.push(`├◆ Scripts: ${metadata.scriptsCount}`);
  report.push(`└─ Stylesheets: ${metadata.stylesheetsCount}`);
  report.push(``);
  
  // Headers (truncated)
  const headers = [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase().includes('security') || 
        key.toLowerCase().includes('cache') ||
        key.toLowerCase().includes('content') ||
        key.toLowerCase().includes('server')) {
      headers.push(`${key}: ${truncateText(value, 50)}`);
    }
  });
  
  if (headers.length > 0) {
    report.push(`📋 *IMPORTANT HEADERS*`);
    const headerItems = headers.slice(0, 5);
    headerItems.forEach((header, index) => {
      const prefix = index === headerItems.length - 1 ? '└─' : '├◆ ';
      report.push(`${prefix} ${header}`);
    });
    if (headers.length > 5) report.push(`└─ ... and ${headers.length - 5} more`);
    report.push(``);
  }
  
  // Icons
  if (metadata.icons.length > 0) {
    report.push(`🎨 *FAVICONS*`);
    metadata.icons.slice(0, 3).forEach((icon, i) => {
      const prefix = i === metadata.icons.length - 1 ? '└─' : '├◆ ';
      report.push(`${prefix} ${truncateText(icon, 60)}`);
    });
    report.push(``);
  }
  
  // Recommendations
  const recommendations = [];
  
  if (!url.startsWith('https')) {
    recommendations.push('🔒 Enable HTTPS for better security');
  }
  
  if (!metadata.title) {
    recommendations.push('📝 Add a proper title tag for SEO');
  }
  
  if (!metadata.description) {
    recommendations.push('📝 Add meta description for better SEO');
  }
  
  if (metadata.headings.h1 === 0) {
    recommendations.push('📝 Add H1 heading for better structure');
  }
  
  if (metadata.headings.h1 > 1) {
    recommendations.push('📝 Only use one H1 heading per page');
  }
  
  if (performance.grade === 'C' || performance.grade === 'D') {
    recommendations.push('⚡ Optimize page loading speed');
  }
  
  if (security.grade === 'C' || security.grade === 'D') {
    recommendations.push('🛡️ Improve security headers');
  }
  
  if (metadata.imagesCount > 0 && metadata.imagesCount < 3) {
    recommendations.push('🖼️ Add more images for better engagement');
  }
  
  if (recommendations.length > 0) {
    report.push(`💡 *RECOMMENDATIONS*`);
    recommendations.forEach((rec, i) => {
      const prefix = i === recommendations.length - 1 ? '└─' : '├◆ ';
      report.push(`${prefix} ${rec}`);
    });
    report.push(``);
  }
  
  // Quick Stats
  report.push(`📈 *QUICK STATS*`);
  report.push(`├◆ Security: ${security.grade}`);
  report.push(`├◆ Performance: ${performance.grade}`);
  report.push(`├◆ SEO: ${metadata.title && metadata.description ? 'Good' : 'Needs improvement'}`);
  report.push(`└─ Mobile: ${metadata.viewport ? 'Responsive' : 'Check needed'}`);
  
  return report.join('\n');
}

export default {
  name: "inspect",
  description: "Inspect website URLs and get detailed metadata",
  category: "utility",
  usage: ".inspect <url> [options]\nOptions: -f (full), -s (security), -p (performance), -m (metadata), -q (quick)",
  
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    
    // Store message key for editing
    let currentMessageKey = null;
    
    const sendUpdate = async (text, isEdit = false) => {
      try {
        if (isEdit && currentMessageKey) {
          await sock.sendMessage(jid, { 
            text,
            edit: currentMessageKey
          }, { quoted: m });
        } else {
          const newMsg = await sock.sendMessage(jid, { text }, { quoted: m });
          currentMessageKey = newMsg.key;
        }
      } catch (error) {
        console.log("Message error:", error.message);
        const newMsg = await sock.sendMessage(jid, { text }, { quoted: m });
        currentMessageKey = newMsg.key;
      }
    };
    
    // Show help if no arguments
    if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
      const helpMessage = `🔍 *WEBSITE INSPECTOR*\n\n` +
        `Analyze and inspect website URLs for metadata, security, performance, and SEO.\n\n` +
        `*Usage:*\n` +
        `• .inspect <url> - Basic inspection\n` +
        `• .inspect <url> -f - Full detailed report\n` +
        `• .inspect <url> -s - Security analysis only\n` +
        `• .inspect <url> -p - Performance analysis only\n` +
        `• .inspect <url> -m - Metadata only\n` +
        `• .inspect <url> -q - Quick summary\n` +
        `• Reply to URL with .inspect\n\n` +
        `*Examples:*\n` +
        `• .inspect https://example.com\n` +
        `• .inspect https://github.com -f\n` +
        `• .inspect https://google.com -s\n` +
        `• .inspect -h - Show this help\n\n` +
        `*What it analyzes:*\n` +
        `• Metadata (title, description, keywords)\n` +
        `• Open Graph & Twitter Cards\n` +
        `• Security headers\n` +
        `• Performance metrics\n` +
        `• SEO elements\n` +
        `• Mobile responsiveness\n` +
        `• Content structure`;
      
      await sendUpdate(helpMessage);
      return;
    }
    
    // Parse arguments
    let url = args[0];
    const options = {
      full: args.includes('-f'),
      security: args.includes('-s'),
      performance: args.includes('-p'),
      metadata: args.includes('-m'),
      simple: args.includes('-q')
    };
    
    // Extract URL from quoted message
    if (!isValidUrl(url) && m.quoted) {
      const quotedMsg = m.quoted.message;
      let extractedText = '';
      
      if (quotedMsg.conversation) {
        extractedText = quotedMsg.conversation;
      } else if (quotedMsg.extendedTextMessage?.text) {
        extractedText = quotedMsg.extendedTextMessage.text;
      } else if (quotedMsg.imageMessage?.caption) {
        extractedText = quotedMsg.imageMessage.caption;
      } else if (quotedMsg.videoMessage?.caption) {
        extractedText = quotedMsg.videoMessage.caption;
      }
      
      // Extract URL from text
      const urlMatch = extractedText.match(/(https?:\/\/[^\s<>"']+)/i);
      if (urlMatch) {
        url = urlMatch[0];
      } else {
        await sendUpdate("❌ *No URL Found*\n\nPlease provide a valid URL or reply to a message containing a URL.\n\nExample: .inspect https://example.com");
        return;
      }
    }
    
    // Validate URL
    if (!isValidUrl(url)) {
      await sendUpdate("❌ *Invalid URL*\n\nURL must start with http:// or https://\n\nExample: .inspect https://example.com\nExample: .inspect http://localhost:3000");
      return;
    }
    
    // Add https if missing
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    try {
      // Initial message
      await sendUpdate(`🔍 *Starting Inspection*\n\n🌐 ${url}\n\n⏳ Please wait, analyzing website...`);
      
      const startTime = Date.now();
      
      // Fetch the website with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      let response;
      let html = '';
      
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          redirect: 'follow'
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Update status
        await sendUpdate(`🔍 *Inspecting Website*\n\n🌐 ${url}\n📡 Status: ${response.status} ${response.statusText}\n📊 Reading content...`, true);
        
        // Get HTML content
        html = await response.text();
        
        if (!html || html.length < 50) {
          throw new Error('Website returned empty or invalid content');
        }
        
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout after 20 seconds');
        }
        if (fetchError.type === 'system' && fetchError.code === 'ENOTFOUND') {
          throw new Error('DNS lookup failed. Website may not exist');
        }
        throw fetchError;
      }
      
      // Update progress
      await sendUpdate(`🔍 *Analyzing Content*\n\n🌐 ${url}\n📊 Size: ${formatBytes(html.length)}\n🔍 Extracting metadata...`, true);
      
      // Extract metadata
      const metadata = extractMetadata(html, url);
      
      // Update progress
      await sendUpdate(`🔍 *Analyzing Security*\n\n🌐 ${url}\n🛡️ Checking security headers...\n⚡ Measuring performance...`, true);
      
      // Analyze security
      const security = analyzeSecurityHeaders(response.headers);
      
      // Analyze performance
      const performance = analyzePerformance(startTime, response.headers.get('content-length'), response.headers);
      
      // Generate report based on options
      let report;
      
      if (options.simple) {
        // Simple report
        report = `🔍 *QUICK INSPECTION*\n\n` +
                 `🌐 *URL:* ${url}\n` +
                 `📡 *Status:* ${response.status} ${response.statusText}\n` +
                 `📝 *Title:* ${metadata.title || 'Not found'}\n` +
                 `📄 *Description:* ${truncateText(metadata.description, 100) || 'Not found'}\n` +
                 `🛡️ *Security:* ${security.grade}\n` +
                 `⚡ *Performance:* ${performance.grade} (${performance.loadTime})\n` +
                 `📊 *Size:* ${performance.size}\n` +
                 `🔗 *Links:* ${metadata.linksCount}\n` +
                 `🖼️ *Images:* ${metadata.imagesCount}\n` +
                 `📱 *Mobile:* ${metadata.viewport ? '✅' : '⚠️'}`;
                 
      } else if (options.security) {
        // Security-focused report
        report = `🛡️ *SECURITY INSPECTION*\n\n` +
                 `🌐 *URL:* ${url}\n` +
                 `📡 *Status:* ${response.status} ${response.statusText}\n` +
                 `📊 *Grade:* ${security.grade}\n` +
                 `🔒 *HTTPS:* ${url.startsWith('https') ? 'Yes ✅' : 'No ⚠️'}\n\n`;
        
        if (security.issues.length > 0) {
          report += `⚠️ *ISSUES FOUND:*\n`;
          security.issues.forEach(issue => report += `• ${issue}\n`);
        } else {
          report += `✅ *No security issues found*\n`;
        }
        
        report += `\n📋 *SECURITY HEADERS:*\n`;
        const securityHeaders = [];
        response.headers.forEach((value, key) => {
          if (key.toLowerCase().includes('security') || 
              key.toLowerCase().includes('x-') ||
              key === 'strict-transport-security' ||
              key === 'content-security-policy') {
            securityHeaders.push(`• ${key}: ${truncateText(value, 60)}`);
          }
        });
        
        if (securityHeaders.length > 0) {
          report += securityHeaders.slice(0, 8).join('\n');
          if (securityHeaders.length > 8) {
            report += `\n... and ${securityHeaders.length - 8} more`;
          }
        } else {
          report += `No security headers found ⚠️`;
        }
        
        // Add recommendations
        if (security.issues.length > 0) {
          report += `\n\n💡 *RECOMMENDATIONS:*\n`;
          if (!url.startsWith('https')) report += `• Enable HTTPS immediately\n`;
          if (security.issues.some(i => i.includes('Missing:'))) report += `• Add missing security headers\n`;
          if (security.issues.some(i => i.includes('Weak:'))) report += `• Strengthen security header configurations\n`;
        }
        
      } else if (options.performance) {
        // Performance-focused report
        report = `⚡ *PERFORMANCE INSPECTION*\n\n` +
                 `🌐 *URL:* ${url}\n` +
                 `📡 *Status:* ${response.status} ${response.statusText}\n` +
                 `📊 *Grade:* ${performance.grade}\n` +
                 `⏱️ *Load Time:* ${performance.loadTime}\n` +
                 `📏 *Size:* ${performance.size}\n` +
                 `🗜️ *Compression:* ${performance.compression}\n` +
                 `💾 *Cache:* ${performance.cacheControl}\n` +
                 `🖥️ *Server:* ${performance.server}\n\n`;
        
        report += `📊 *CONTENT ANALYSIS:*\n` +
                  `• HTML Size: ${formatBytes(html.length)}\n` +
                  `• Images: ${metadata.imagesCount}\n` +
                  `• Scripts: ${metadata.scriptsCount}\n` +
                  `• Stylesheets: ${metadata.stylesheetsCount}\n` +
                  `• Total Assets: ${metadata.scriptsCount + metadata.stylesheetsCount + metadata.imagesCount}\n\n`;
        
        if (performance.grade === 'C' || performance.grade === 'D') {
          report += `💡 *RECOMMENDATIONS:*\n`;
          if (parseInt(performance.loadTime) > 3000) {
            report += `• Optimize images (use WebP format)\n`;
          }
          if (performance.compression === 'None') {
            report += `• Enable gzip/brotli compression\n`;
          }
          if (metadata.scriptsCount > 20) {
            report += `• Reduce and bundle JavaScript files\n`;
          }
          if (metadata.imagesCount > 30) {
            report += `• Implement lazy loading for images\n`;
          }
          if (!performance.cacheControl.includes('max-age')) {
            report += `• Implement browser caching\n`;
          }
        } else {
          report += `✅ *Performance is good!*\n`;
        }
        
      } else if (options.metadata) {
        // Metadata-focused report
        report = `📋 *METADATA INSPECTION*\n\n` +
                 `🌐 *URL:* ${url}\n` +
                 `📡 *Status:* ${response.status} ${response.statusText}\n\n`;
        
        report += `📝 *BASIC METADATA:*\n`;
        if (metadata.title) report += `• Title: ${metadata.title}\n`;
        if (metadata.description) report += `• Description: ${truncateText(metadata.description, 120)}\n`;
        if (metadata.keywords) report += `• Keywords: ${metadata.keywords}\n`;
        if (metadata.author) report += `• Author: ${metadata.author}\n`;
        if (metadata.language) report += `• Language: ${metadata.language}\n`;
        if (metadata.charset) report += `• Charset: ${metadata.charset}\n`;
        if (metadata.viewport) report += `• Viewport: ${metadata.viewport}\n`;
        
        report += `\n🎭 *SOCIAL METADATA:*\n`;
        if (metadata.ogTitle) report += `• OG Title: ${metadata.ogTitle}\n`;
        if (metadata.ogDescription) report += `• OG Description: ${truncateText(metadata.ogDescription, 100)}\n`;
        if (metadata.ogImage) report += `• OG Image: ${truncateText(metadata.ogImage, 80)}\n`;
        if (metadata.twitterTitle) report += `• Twitter Title: ${metadata.twitterTitle}\n`;
        if (metadata.twitterCard) report += `• Twitter Card: ${metadata.twitterCard}\n`;
        
        report += `\n📊 *CONTENT STRUCTURE:*\n` +
                  `• H1 Headings: ${metadata.headings.h1}\n` +
                  `• H2 Headings: ${metadata.headings.h2}\n` +
                  `• H3 Headings: ${metadata.headings.h3}\n` +
                  `• Paragraphs: ${metadata.paragraphs}\n` +
                  `• Links: ${metadata.linksCount}\n` +
                  `• Images: ${metadata.imagesCount}\n` +
                  `• Scripts: ${metadata.scriptsCount}\n` +
                  `• Stylesheets: ${metadata.stylesheetsCount}\n`;
        
        if (metadata.icons.length > 0) {
          report += `\n🎨 *FAVICONS:*\n`;
          metadata.icons.slice(0, 3).forEach(icon => {
            report += `• ${truncateText(icon, 70)}\n`;
          });
        }
        
        if (metadata.links.length > 0) {
          report += `\n🔗 *SAMPLE LINKS:*\n`;
          metadata.links.slice(0, 3).forEach(link => {
            report += `• ${truncateText(link.text, 30)} → ${truncateText(link.url, 50)}\n`;
          });
        }
        
      } else {
        // Full detailed report (default or -f)
        report = formatInspectionReport(url, response, metadata, security, performance, html);
      }
      
      // Send the final report
      await sendUpdate(report, true);
      
    } catch (error) {
      console.error('Inspect error:', error);
      
      let errorMessage = `❌ *Inspection Failed*\n\n`;
      errorMessage += `🌐 *URL:* ${url}\n\n`;
      errorMessage += `💥 *Error:* ${error.message}\n\n`;
      
      // Provide helpful suggestions
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage += `*Possible issues:*\n`;
        errorMessage += `• Website is too slow (timeout)\n`;
        errorMessage += `• Server not responding\n`;
        errorMessage += `• High traffic or maintenance\n`;
        errorMessage += `💡 Try: .inspect <url> -q for quick check`;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage += `*Network/DNS error*\n`;
        errorMessage += `• Check internet connection\n`;
        errorMessage += `• Website might not exist\n`;
        errorMessage += `• DNS issues or domain expired\n`;
        errorMessage += `• Try using http:// instead of https://`;
      } else if (error.message.includes('empty') || error.message.includes('invalid')) {
        errorMessage += `*Content error*\n`;
        errorMessage += `• Website returned no content\n`;
        errorMessage += `• Might be behind Cloudflare/security\n`;
        errorMessage += `• Could be a blank page\n`;
        errorMessage += `• Check if URL points to HTML page`;
      } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
        errorMessage += `*SSL Certificate Error*\n`;
        errorMessage += `• Try using http:// instead\n`;
        errorMessage += `• Certificate might be invalid\n`;
        errorMessage += `• Self-signed certificate\n`;
        errorMessage += `💡 Try: .inspect http://${url.replace(/^https?:\/\//, '')}`;
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage += `*Access Denied*\n`;
        errorMessage += `• Website blocked the request\n`;
        errorMessage += `• Might require authentication\n`;
        errorMessage += `• Could be blocking bots\n`;
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage += `*Page Not Found*\n`;
        errorMessage += `• URL might be incorrect\n`;
        errorMessage += `• Page was moved or deleted\n`;
        errorMessage += `• Check the URL spelling\n`;
      } else if (error.message.includes('50')) {
        errorMessage += `*Server Error*\n`;
        errorMessage += `• Website server error\n`;
        errorMessage += `• Try again later\n`;
        errorMessage += `• Site might be down\n`;
      }
      
      errorMessage += `\n💡 *Tips:*\n`;
      errorMessage += `• Make sure URL starts with http:// or https://\n`;
      errorMessage += `• Try .inspect -h for help\n`;
      errorMessage += `• For problem sites, use .inspect <url> -q`;
      
      await sendUpdate(errorMessage, true);
    }
  }
};
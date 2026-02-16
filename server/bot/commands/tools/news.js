// commands/news/citizen.js
import axios from 'axios';

export default {
    name: "citizen",
    alias: ["news", "headlines"],
    category: "news",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        // Start reaction
        await sock.sendMessage(jid, { react: { text: "📰", key: m.key } });
        
        try {
            // Fetch news
            const response = await axios.get(
                'https://apiskeith.vercel.app/news/citizen',
                { timeout: 10000 }
            );
            
            const news = response.data?.result;
            if (!news) throw new Error("No news data");
            
            // Create ONE comprehensive message
            let newsMessage = `📰 *${news.siteName} NEWS*\n`;
            newsMessage += `⏰ Updated: ${new Date(news.lastUpdated).toLocaleTimeString()}\n`;
            newsMessage += `🔗 Source: ${news.url}\n\n`;
            
            // 1. BREAKING NEWS (if available)
            if (news.pinnedStories && news.pinnedStories.length > 0) {
                const breaking = news.pinnedStories[0];
                newsMessage += `🚨 *BREAKING:* ${breaking.title}\n`;
                
                if (breaking.articleDetails?.summary) {
                    const summary = breaking.articleDetails.summary.replace(/\n/g, ' ').substring(0, 120);
                    newsMessage += `📝 ${summary}...\n`;
                }
                
                if (breaking.articleDetails?.publishedDate) {
                    newsMessage += `📅 ${breaking.articleDetails.publishedDate}\n`;
                }
                newsMessage += `\n`;
            }
            
            // 2. TOP 5 HEADLINES
            if (news.topStories && news.topStories.length > 0) {
                newsMessage += `📋 *TOP HEADLINES:*\n`;
                
                news.topStories.slice(0, 5).forEach((story, index) => {
                    newsMessage += `${index + 1}. ${story.title}\n`;
                    
                    if (story.timestamp) {
                        newsMessage += `   ⏰ ${story.timestamp}\n`;
                    }
                    
                    if (story.excerpt) {
                        const shortExcerpt = story.excerpt.replace(/\n/g, ' ').substring(0, 60);
                        newsMessage += `   ${shortExcerpt}...\n`;
                    }
                    
                    newsMessage += `\n`;
                });
            }
            
            // 3. QUICK STATS
            const totalStories = (news.topStories?.length || 0) + (news.pinnedStories?.length || 0);
            newsMessage += `📊 *QUICK STATS:*\n`;
            newsMessage += `• Total stories: ${totalStories}\n`;
            newsMessage += `• Breaking news: ${news.pinnedStories?.length || 0}\n`;
            newsMessage += `• Latest update: ${news.topStories?.[0]?.timestamp || 'Just now'}\n\n`;
            
            // 4. HOW TO GET MORE INFO
            newsMessage += `💡 *HOW TO READ MORE:*\n`;
            newsMessage += `Visit: ${news.url}\n`;
            newsMessage += `Or search specific topics\n\n`;
            
            // 5. REFRESH INFO
            newsMessage += `🔄 Refresh: ${prefix}news`;
            
            // Send the ONE message
            await sock.sendMessage(jid, {
                text: newsMessage
            }, { quoted: m });
            
            // Success reaction
            await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
            
        } catch (error) {
            console.error('News error:', error);
            
            await sock.sendMessage(jid, { react: { text: "💥", key: m.key } });
            
            const errorMsg = `💥 News unavailable\n\n` +
                           `Failed to fetch latest headlines\n\n` +
                           `Try again in a few minutes`;
            
            await sock.sendMessage(jid, {
                text: errorMsg
            }, { quoted: m });
        }
    }
};
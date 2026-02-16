// commands/tools/vv2.js - MATCHES YOUR FLUX.JS STRUCTURE
export default {
    name: "vv2",
    alias: ["stealth", "viewonce"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        // Check if it's a reply to a message
        const isReply = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!isReply) {
            return sock.sendMessage(jid, {
                text: `🔒 *STEALTH VIEW-ONCE DOWNLOADER* 🔒\n\n` +
                      `Usage: Reply to a view-once message with:\n` +
                      `${PREFIX}vv2\n\n` +
                      `Features:\n` +
                      `• Downloads view-once photos/videos/audio\n` +
                      `• Saves them for you\n` +
                      `• Works in stealth mode\n\n` +
                      `Examples:\n` +
                      `1. Someone sends view-once photo\n` +
                      `2. You reply with: ${PREFIX}vv2\n` +
                      `3. Photo gets saved\n\n` +
                      `Supported: Images, Videos, Audio messages`
            }, { quoted: m });
        }
        
        try {
            // Send initial message
            await sock.sendMessage(jid, {
                text: `🔍 Processing view-once media...`
            }, { quoted: m });
            
            // Get the quoted message
            const quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
            
            // Check if it's view-once
            const isViewOnce = checkViewOnce(quotedMsg);
            
            if (!isViewOnce) {
                return sock.sendMessage(jid, {
                    text: `❌ This is not a view-once message!\n\n` +
                          `Only view-once photos, videos, or audio can be downloaded.`
                }, { quoted: m });
            }
            
            // Extract media type
            const mediaType = extractMediaType(quotedMsg);
            
            if (!mediaType) {
                return sock.sendMessage(jid, {
                    text: `❌ Unsupported media type\n\n` +
                          `Only images, videos, and audio are supported.`
                }, { quoted: m });
            }
            
            // Download the media
            const mediaBuffer = await downloadMedia(sock, quotedMsg, mediaType);
            
            if (!mediaBuffer) {
                throw new Error("Failed to download media");
            }
            
            // Save or send the media
            await handleDownloadedMedia(sock, jid, mediaBuffer, mediaType, m);
            
        } catch (error) {
            console.error("VV2 error:", error.message);
            
            await sock.sendMessage(jid, {
                text: `❌ Download failed: ${error.message}\n\n` +
                      `Possible reasons:\n` +
                      `• Media has expired\n` +
                      `• File too large\n` +
                      `• Network issues\n` +
                      `• Unsupported format`
            }, { quoted: m });
        }
    }
};

// Check if message is view-once
function checkViewOnce(message) {
    if (!message) return false;
    
    // Check various view-once formats
    if (message.imageMessage?.viewOnce) return true;
    if (message.videoMessage?.viewOnce) return true;
    if (message.audioMessage?.viewOnce) return true;
    
    // Check wrapped view-once
    if (message.viewOnceMessageV2 || message.viewOnceMessage) return true;
    
    return false;
}

// Extract media type from message
function extractMediaType(message) {
    if (!message) return null;
    
    // Direct media
    if (message.imageMessage?.viewOnce) return "image";
    if (message.videoMessage?.viewOnce) return "video";
    if (message.audioMessage?.viewOnce) return "audio";
    
    // Wrapped view-once
    let wrapped = message.viewOnceMessageV2?.message || 
                  message.viewOnceMessage?.message;
    
    if (wrapped?.imageMessage) return "image";
    if (wrapped?.videoMessage) return "video";
    if (wrapped?.audioMessage) return "audio";
    
    return null;
}

// Download media using baileys
async function downloadMedia(sock, message, mediaType) {
    try {
        // Dynamically import baileys functions
        const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
        
        // Download the media
        const buffer = await downloadMediaMessage(
            {
                key: { remoteJid: 'temp', id: 'temp' },
                message: message
            },
            'buffer',
            {},
            {
                logger: { level: 'silent' },
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        return buffer;
        
    } catch (error) {
        console.error("Download error:", error);
        throw error;
    }
}

// Handle downloaded media
async function handleDownloadedMedia(sock, jid, buffer, mediaType, originalMsg) {
    // Generate filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${mediaType}_${timestamp}_${random}`;
    
    // Send based on media type
    switch (mediaType) {
        case "image":
            await sock.sendMessage(jid, {
                image: buffer,
                caption: ``
            }, { quoted: originalMsg });
            break;
            
        case "video":
            await sock.sendMessage(jid, {
                video: buffer,
                caption: ``
            }, { quoted: originalMsg });
            break;
            
        case "audio":
            await sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                caption: `vv2 😎`
            }, { quoted: originalMsg });
            break;
    }
    
    // Also send as file attachment
    await sock.sendMessage(jid, {
        document: buffer,
        fileName: `${filename}.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3'}`,
        mimetype: mediaType === 'image' ? 'image/jpeg' : 
                  mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'
    });
}
import { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📌 Convert audio to voice note (if ffmpeg available)
async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        try {
            import('fluent-ffmpeg').then(ffmpeg => {
                const inStream = new PassThrough();
                inStream.end(inputBuffer);
                const outStream = new PassThrough();
                const chunks = [];

                ffmpeg.default(inStream)
                    .noVideo()
                    .audioCodec("libopus")
                    .format("ogg")
                    .audioBitrate("48k")
                    .audioChannels(1)
                    .audioFrequency(48000)
                    .on("error", reject)
                    .on("end", () => resolve(Buffer.concat(chunks)))
                    .pipe(outStream, { end: true });

                outStream.on("data", chunk => chunks.push(chunk));
            }).catch(() => {
                resolve(inputBuffer);
            });
        } catch {
            resolve(inputBuffer);
        }
    });
}

// 📌 Download message content to buffer
async function downloadToBuffer(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

// 📌 Build payload from quoted message
async function buildPayloadFromQuoted(quotedMessage) {
    // Handle video message
    if (quotedMessage.videoMessage) {
        const buffer = await downloadToBuffer(quotedMessage.videoMessage, 'video');
        return { 
            video: buffer, 
            caption: quotedMessage.videoMessage.caption || '',
            gifPlayback: quotedMessage.videoMessage.gifPlayback || false,
            mimetype: quotedMessage.videoMessage.mimetype || 'video/mp4'
        };
    }
    // Handle image message
    else if (quotedMessage.imageMessage) {
        const buffer = await downloadToBuffer(quotedMessage.imageMessage, 'image');
        return { 
            image: buffer, 
            caption: quotedMessage.imageMessage.caption || ''
        };
    }
    // Handle audio message
    else if (quotedMessage.audioMessage) {
        const buffer = await downloadToBuffer(quotedMessage.audioMessage, 'audio');
        
        // Check if it's voice note (ptt) or regular audio
        if (quotedMessage.audioMessage.ptt) {
            try {
                const audioVn = await toVN(buffer);
                return { 
                    audio: audioVn, 
                    mimetype: "audio/ogg; codecs=opus", 
                    ptt: true 
                };
            } catch {
                return { 
                    audio: buffer, 
                    mimetype: quotedMessage.audioMessage.mimetype || 'audio/mpeg',
                    ptt: true 
                };
            }
        } else {
            return { 
                audio: buffer, 
                mimetype: quotedMessage.audioMessage.mimetype || 'audio/mpeg',
                ptt: false 
            };
        }
    }
    // Handle sticker message
    else if (quotedMessage.stickerMessage) {
        const buffer = await downloadToBuffer(quotedMessage.stickerMessage, 'sticker');
        return { 
            sticker: buffer,
            mimetype: quotedMessage.stickerMessage.mimetype || 'image/webp'
        };
    }
    // Handle text message
    else if (quotedMessage.conversation || quotedMessage.extendedTextMessage?.text) {
        const textContent = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || '';
        return { text: textContent };
    }
    return null;
}

// 📌 Detect media type - ADD THIS FUNCTION
function detectMediaType(quotedMessage) {
    if (!quotedMessage) return 'Text';
    if (quotedMessage.videoMessage) return 'Video';
    if (quotedMessage.imageMessage) return 'Image';
    if (quotedMessage.audioMessage) return 'Audio';
    if (quotedMessage.stickerMessage) return 'Sticker';
    return 'Text';
}

// 📌 Send group status - ADD THIS FUNCTION
async function sendGroupStatus(conn, jid, content) {
    const inside = await generateWAMessageContent(content, { upload: conn.waUploadToServer });
    const messageSecret = crypto.randomBytes(32);

    const m = generateWAMessageFromContent(jid, {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: { message: { ...inside, messageContextInfo: { messageSecret } } }
    }, {});

    await conn.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
}

// 📌 Get help text
function getHelpText() {
    const prefix = '.';
    return `💡 *Group Status Command*\n\n` +
           `*Usage:*\n` +
           `• \`${prefix}togstatus\` Reply to video/image/audio/sticker/text\n` +
           `• \`${prefix}togstatus\` Your text here\n` +
           `📝 *Note:* Admins only. Captions for videos/images.`;
}

// 📌 Load settings for owner check
async function loadSettings() {
    const possiblePaths = [
        path.join(process.cwd(), "settings.js"),
        path.join(process.cwd(), "config", "settings.js"),
        path.join(__dirname, "..", "settings.js"),
    ];
    
    for (const settingsPath of possiblePaths) {
        try {
            if (fs.existsSync(settingsPath)) {
                const module = await import(`file://${settingsPath}`);
                return module.default || module;
            }
        } catch (error) {
            continue;
        }
    }
    return {};
}

// 📌 Extract command and text
function parseCommand(messageText) {
    const commandRegex = /^[.!#/]?(togstatus|swgc|groupstatus|tosgroup|gs|gstatus)\s*/i;
    const match = messageText.match(commandRegex);
    
    if (match) {
        const textAfterCommand = messageText.slice(match[0].length).trim();
        return { command: match[0].trim(), textAfterCommand };
    }
    
    return { command: null, textAfterCommand: messageText };
}

// 📌 Main command
export default {
    name: 'togstatus',
    aliases: ['swgc', 'groupstatus', 'tosgroup', 'gs', 'gstatus'],
    description: 'Send group status updates',
    category: 'group',
    adminOnly: true,
    ownerOnly: false,

    async execute(sock, m, args) {
        try {
            const jid = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            
            // Check if in group
            if (!jid.endsWith('@g.us')) {
                await sock.sendMessage(jid, { 
                    text: '❌ This command only works in groups!'
                }, { quoted: m });
                return;
            }
            
            // Check admin status
            try {
                const groupMetadata = await sock.groupMetadata(jid);
                const participant = groupMetadata.participants.find(p => p.id === sender);
                const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                
                if (!isAdmin) {
                    await sock.sendMessage(jid, { 
                        text: '❌ Only group admins can use this command!'
                    }, { quoted: m });
                    return;
                }
            } catch {
                await sock.sendMessage(jid, { 
                    text: '❌ Could not verify admin status.'
                }, { quoted: m });
                return;
            }
            
            // Get message content
            const messageText = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || 
                               '';
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // Show help if no content
            if (!quotedMessage && !messageText.trim()) {
                await sock.sendMessage(jid, { 
                    text: getHelpText()
                }, { quoted: m });
                return;
            }
            
            // Parse command
            const { textAfterCommand } = parseCommand(messageText);
            
            let payload = null;
            let mediaType = 'Text';
            
            // Process quoted message
            if (quotedMessage) {
                mediaType = detectMediaType(quotedMessage);
                payload = await buildPayloadFromQuoted(quotedMessage);
                
                // Add caption for videos/images
                if (textAfterCommand && payload && (payload.video || payload.image)) {
                    payload.caption = textAfterCommand;
                }
                
                // Combine text if quoted text
                if (mediaType === 'Text' && payload?.text && textAfterCommand) {
                    payload.text = payload.text + '\n\n' + textAfterCommand;
                }
            } 
            // Process text-only command
            else if (messageText.trim() && textAfterCommand) {
                payload = { text: textAfterCommand };
            }
            
            if (!payload) {
                await sock.sendMessage(jid, { 
                    text: '❌ Could not process the message.'
                }, { quoted: m });
                return;
            }
            
            // Send group status
            await sendGroupStatus(sock, jid, payload);
            
            // Send single success message
            await sock.sendMessage(jid, { 
                text: `✅ Status sent successfully!\n📊 Type: ${mediaType}`
            }, { quoted: m });
            
        } catch (error) {
            console.error('[TogStatus] Error:', error);
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Failed: ${error.message}`
            }, { quoted: m });
        }
    }
};
// commands/utility/qrscan.js
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

// Use native fetch (Node 18+ has it globally)
// For older Node versions, create a simple fetch polyfill
const getFetch = () => {
    // If global fetch exists (Node 18+ or browser)
    if (typeof globalThis.fetch === 'function') {
        return globalThis.fetch;
    }
    
    // Create simple fetch polyfill using Node's https module
    const https = require('https');
    const http = require('http');
    
    return async function fetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const module = isHttps ? https : http;
            
            const reqOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: 15000 // 15 second timeout
            };
            
            const req = module.request(reqOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const response = {
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers,
                        url: url,
                        text: async () => data,
                        json: async () => {
                            try {
                                return JSON.parse(data);
                            } catch (e) {
                                throw new Error(`Invalid JSON: ${e.message}`);
                            }
                        }
                    };
                    resolve(response);
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            // Write body if provided
            if (options.body) {
                if (typeof options.body === 'string') {
                    req.write(options.body);
                } else if (options.body instanceof URLSearchParams) {
                    req.write(options.body.toString());
                }
            }
            
            req.end();
        });
    };
};

const fetch = getFetch();

export default {
    name: 'qrscan',
    alias: ['scan', 'readqr'],
    category: 'utility',
    description: 'Scan QR codes from images',
    
    async execute(sock, msg, args, prefix) {
        const chatId = msg.key.remoteJid;
        const msgId = msg.key.id;
        
        if (!foxCanUse(msg, 'qrscan')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(chatId, { text: message, edit: msgId });
            return;
        }
        
        // Check for image
        const hasImage = msg.message?.imageMessage || 
                        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        
        if (!hasImage) {
            await sock.sendMessage(chatId, {
                text: `📷 *QR SCANNER* 🦊\n\n` +
                      `Send or reply to a QR code image!\n\n` +
                      `*Usage:*\n` +
                      `• Send QR image\n` +
                      `• Reply to QR image with: ${prefix}qrscan\n\n` +
                      `*Example:*\n` +
                      `[QR Code Image]\n` +
                      `${prefix}qrscan\n\n` +
                      `🦊 I'll download and scan it for you!`,
                edit: msgId
            });
            return;
        }
        
        try {
            // Start scanning process
            await sock.sendMessage(chatId, {
                text: `🔍 *DOWNLOADING IMAGE...* 🦊\n\n` +
                      `Step 1/3: Getting image data...\n` +
                      `🦊 Please wait...`,
                edit: msgId
            });
            
            let imageBuffer;
            
            // Download the image
            if (msg.message.imageMessage) {
                imageBuffer = await sock.downloadMediaMessage(msg);
            } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                const quotedMsg = {
                    key: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId
                    },
                    message: msg.message.extendedTextMessage.contextInfo.quotedMessage
                };
                imageBuffer = await sock.downloadMediaMessage(quotedMsg);
            }
            
            if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Empty image received');
            }
            
            await sock.sendMessage(chatId, {
                text: `🔍 *CONVERTING IMAGE...* 🦊\n\n` +
                      `Step 2/3: Preparing for scanning...\n` +
                      `Image size: ${Math.round(imageBuffer.length / 1024)}KB\n` +
                      `🦊 Processing...`,
                edit: msgId
            });
            
            // Convert to base64
            const base64Image = imageBuffer.toString('base64');
            
            await sock.sendMessage(chatId, {
                text: `🔍 *SCANNING QR CODE...* 🦊\n\n` +
                      `Step 3/3: Analyzing image...\n` +
                      `Using QR scanning service...\n` +
                      `🦊 This takes 5-10 seconds...`,
                edit: msgId
            });
            
            let qrData = null;
            let methodUsed = '';
            
            // METHOD 1: Simple QR Server API (GET request - easiest)
            try {
                const apiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=data:image/jpeg;base64,${base64Image}`;
                
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data && data[0] && data[0].symbol && data[0].symbol[0] && data[0].symbol[0].data) {
                    qrData = data[0].symbol[0].data;
                    methodUsed = 'QR Server API';
                }
            } catch (e) {
                console.log('Method 1 failed:', e.message);
            }
            
            // METHOD 2: GoQR alternative (POST request)
            if (!qrData) {
                try {
                    const apiUrl = 'https://api.qrserver.com/v1/read-qr-code/';
                    
                    // Simple form data as string
                    const body = `file=data:image/jpeg;base64,${base64Image}`;
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: body
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data[0] && data[0].symbol && data[0].symbol[0] && data[0].symbol[0].data) {
                            qrData = data[0].symbol[0].data;
                            methodUsed = 'GoQR POST API';
                        }
                    }
                } catch (e) {
                    console.log('Method 2 failed:', e.message);
                }
            }
            
            // METHOD 3: Simple GET request to ZXing
            if (!qrData) {
                try {
                    // Encode base64 for URL
                    const encodedBase64 = encodeURIComponent(base64Image);
                    const apiUrl = `https://zxing.org/w/decode?u=${encodedBase64}`;
                    
                    const response = await fetch(apiUrl);
                    const text = await response.text();
                    
                    // Simple regex to extract data from ZXing response
                    const regex = /Parsed Result[\s\S]*?<pre>([\s\S]*?)<\/pre>/i;
                    const match = text.match(regex);
                    
                    if (match && match[1]) {
                        qrData = match[1].trim();
                        methodUsed = 'ZXing Web';
                    }
                } catch (e) {
                    console.log('Method 3 failed:', e.message);
                }
            }
            
            // Check if we got data
            if (qrData && qrData.length > 0) {
                // Analyze the QR content
                let type = 'Text';
                let formattedData = qrData;
                let actions = [];
                
                // URL detection
                if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
                    type = 'Website URL';
                    actions.push(`🌐 Open: ${qrData}`);
                }
                // WiFi detection
                else if (qrData.startsWith('WIFI:')) {
                    type = 'WiFi Network';
                    const wifiMatch = qrData.match(/WIFI:S:(.*?);T:(.*?);P:(.*?);;/);
                    if (wifiMatch) {
                        formattedData = `📶 WiFi Details:\nSSID: ${wifiMatch[1]}\nSecurity: ${wifiMatch[2]}\nPassword: ${wifiMatch[3]}`;
                    }
                }
                // Contact card
                else if (qrData.startsWith('BEGIN:VCARD')) {
                    type = 'Contact Card';
                    const nameMatch = qrData.match(/FN:(.*?)(\n|$)/);
                    const phoneMatch = qrData.match(/TEL:(.*?)(\n|$)/);
                    const emailMatch = qrData.match(/EMAIL:(.*?)(\n|$)/);
                    
                    formattedData = '👤 Contact Info:\n';
                    if (nameMatch) formattedData += `Name: ${nameMatch[1]}\n`;
                    if (phoneMatch) {
                        formattedData += `Phone: ${phoneMatch[1]}\n`;
                        actions.push(`📞 Call: ${phoneMatch[1]}`);
                    }
                    if (emailMatch) {
                        formattedData += `Email: ${emailMatch[1]}\n`;
                        actions.push(`📧 Email: ${emailMatch[1]}`);
                    }
                }
                // Phone
                else if (qrData.startsWith('tel:')) {
                    type = 'Phone Number';
                    const phone = qrData.replace('tel:', '');
                    formattedData = phone;
                    actions.push(`📞 Call: ${phone}`);
                }
                // Email
                else if (qrData.startsWith('mailto:')) {
                    type = 'Email Address';
                    const email = qrData.replace('mailto:', '');
                    formattedData = email;
                    actions.push(`📧 Email: ${email}`);
                }
                // SMS
                else if (qrData.startsWith('smsto:') || qrData.startsWith('SMSTO:')) {
                    type = 'SMS Message';
                    const parts = qrData.split(':');
                    if (parts.length >= 3) {
                        formattedData = `To: ${parts[1]}\nMessage: ${parts[2]}`;
                        actions.push(`💬 SMS: ${parts[1]}`);
                    }
                }
                
                // Send success result
                let resultText = `✅ *QR CODE SCANNED!* 🦊\n\n`;
                resultText += `*Type:* ${type}\n`;
                resultText += `*Method:* ${methodUsed}\n`;
                resultText += `*Length:* ${qrData.length} chars\n`;
                resultText += `*Scanned by:* ${msg.pushName || 'User'}\n\n`;
                resultText += `*Content:*\n\`\`\`\n${formattedData}\n\`\`\`\n`;
                
                if (actions.length > 0) {
                    resultText += `\n*Actions:*\n${actions.join('\n')}\n`;
                }
                
                resultText += `\n🦊 Scan successful!`;
                
                await sock.sendMessage(chatId, {
                    text: resultText,
                    edit: msgId
                });
                
                // If it's a URL, send a clickable version
                if (type === 'Website URL') {
                    await sock.sendMessage(chatId, {
                        text: `🔗 *Direct Link:*\n${qrData}\n\n🦊 Click to visit!`
                    });
                }
                
            } else {
                // No QR code found
                await sock.sendMessage(chatId, {
                    text: `❌ *NO QR CODE DETECTED* 🦊\n\n` +
                          `I couldn't find a readable QR code in this image.\n\n` +
                          `*Common issues:*\n` +
                          `• Image doesn't contain a QR code\n` +
                          `• QR is blurry/low quality\n` +
                          `• Image is too dark/bright\n` +
                          `• QR is too small in image\n\n` +
                          `*Tips for success:*\n` +
                          `✓ Clear, focused image\n` +
                          `✓ Center the QR code\n` +
                          `✓ Good lighting\n` +
                          `✓ Square aspect ratio\n\n` +
                          `🦊 Try with a clearer QR code image!`,
                    edit: msgId
                });
            }
            
        } catch (error) {
            console.error('QR Scan Error:', error);
            
            // User-friendly error message
            let errorMsg = `❌ *SCAN FAILED* 🦊\n\n`;
            
            if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                errorMsg += `*Timeout Error*\n`;
                errorMsg += `Scanning service took too long.\n\n`;
                errorMsg += `*Quick fix:*\n`;
                errorMsg += `• Try smaller image\n`;
                errorMsg += `• Crop to just QR code\n`;
            } else if (error.message.includes('network') || error.message.includes('Network')) {
                errorMsg += `*Network Error*\n`;
                errorMsg += `Cannot reach scanning service.\n\n`;
                errorMsg += `*Quick fix:*\n`;
                errorMsg += `• Check internet connection\n`;
                errorMsg += `• Try again later\n`;
            } else if (error.message.includes('Empty') || error.message.includes('image')) {
                errorMsg += `*Image Error*\n`;
                errorMsg += `Could not process the image.\n\n`;
                errorMsg += `*Quick fix:*\n`;
                errorMsg += `• Send image again\n`;
                errorMsg += `• Try PNG format\n`;
            } else {
                errorMsg += `*Error:* ${error.message || 'Unknown'}\n\n`;
            }
            
            errorMsg += `*Instant alternatives:*\n`;
            errorMsg += `📱 *Google Lens* - Best scanner\n`;
            errorMsg += `📸 *Phone Camera* - Built-in scanner\n`;
            errorMsg += `🌐 *scanqr.org* - Upload & scan\n\n`;
            errorMsg += `🦊 Want to generate QR? Use ${prefix}qrcode`;
            
            await sock.sendMessage(chatId, {
                text: errorMsg,
                edit: msgId
            });
        }
    }
};
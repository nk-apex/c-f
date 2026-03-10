// // File: ./commands/owner/debugchat.js
// import { readFileSync, writeFileSync, existsSync } from 'fs';

// export default {
//     name: 'debugchat',
//     alias: ['chatinfo', 'debugjid', 'fixjid'],
//     category: 'owner',
//     description: 'Debug and fix JID/LID issues with owner.json data',
    
//     async execute(sock, msg, args, PREFIX, extra) {
//         const chatId = msg.key.remoteJid;
//         const participant = msg.key.participant;
//         const senderJid = participant || chatId;
//         const { jidManager } = extra;
//         const isFromMe = msg.key.fromMe;
        
//         const cleaned = jidManager.cleanJid(senderJid);
//         const isOwner = jidManager.isOwner(msg);
        
//         // Check if user wants to auto-fix
//         const autoFix = args[0] === 'fix' || args[0] === 'auto';
        
//         // Read owner.json directly
//         let ownerData = {};
//         let ownerFileExists = false;
//         let ownerNumber = 'Not found';
//         let ownerJid = 'Not found';
//         let ownerCleanNumber = 'Not found';
//         let ownerCleanJid = 'Not found';
        
//         // Special fix for your case: Check if we need to initialize jidManager
//         let shouldForceInit = false;
        
//         if (existsSync('./owner.json')) {
//             try {
//                 ownerFileExists = true;
//                 ownerData = JSON.parse(readFileSync('./owner.json', 'utf8'));
                
//                 // Extract owner information
//                 ownerNumber = ownerData.OWNER_NUMBER || 'Not set';
//                 ownerJid = ownerData.OWNER_JID || 'Not set';
//                 ownerCleanNumber = ownerData.OWNER_CLEAN_NUMBER || 'Not set';
//                 ownerCleanJid = ownerData.OWNER_CLEAN_JID || 'Not set';
                
//                 // Fix the JID format (remove :74 if present)
//                 if (ownerJid.includes(':74')) {
//                     ownerJid = ownerJid.replace(':74@s.whatsapp.net', '@s.whatsapp.net');
//                     ownerCleanJid = ownerCleanJid || ownerJid;
//                 }
                
//                 if (ownerNumber.includes(':')) {
//                     ownerNumber = ownerNumber.split(':')[0];
//                     ownerCleanNumber = ownerCleanNumber || ownerNumber;
//                 }
                
//                 // Check if jidManager needs initialization
//                 const ownerInfo = jidManager.getOwnerInfo();
//                 if (!ownerInfo.cleanNumber) {
//                     shouldForceInit = true;
//                 }
                
//             } catch (error) {
//                 console.log(`❌ Error reading owner.json: ${error.message}`, 'error');
//             }
//         }
        
//         // Initialize jidManager if needed
//         let initActions = [];
//         if (shouldForceInit || autoFix) {
//             try {
//                 // Method 1: Try to call setOwner
//                 if (jidManager.setOwner && ownerCleanNumber) {
//                     const result = jidManager.setOwner({
//                         rawNumber: ownerCleanNumber,
//                         rawJid: ownerCleanJid
//                     });
//                     if (result?.success) {
//                         initActions.push('✅ Initialized jidManager owner data');
//                     }
//                 }
                
//                 // Method 2: Direct property assignment (if possible)
//                 if (ownerCleanNumber && jidManager.owner) {
//                     jidManager.owner = {
//                         cleanNumber: ownerCleanNumber,
//                         cleanJid: ownerCleanJid,
//                         rawJid: ownerJid
//                     };
//                     initActions.push('✅ Directly set jidManager.owner');
//                 }
                
//                 // Method 3: Update global variables
//                 if (ownerCleanNumber) {
//                     global.OWNER_NUMBER = ownerCleanNumber;
//                     global.OWNER_CLEAN_NUMBER = ownerCleanNumber;
//                     global.OWNER_JID = ownerCleanJid;
//                     global.OWNER_CLEAN_JID = ownerCleanJid;
//                     initActions.push('✅ Set global owner variables');
//                 }
                
//                 // Save updated owner.json
//                 if (ownerFileExists) {
//                     ownerData.OWNER_CLEAN_NUMBER = ownerCleanNumber;
//                     ownerData.OWNER_CLEAN_JID = ownerCleanJid;
//                     ownerData.lastUpdated = new Date().toISOString();
//                     writeFileSync('./owner.json', JSON.stringify(ownerData, null, 2));
//                     initActions.push('✅ Updated owner.json');
//                 }
                
//             } catch (error) {
//                 initActions.push(`❌ Error: ${error.message}`);
//             }
//         }
        
//         let debugInfo = `🔍 *CHAT DEBUG INFORMATION*\n`;
//         if (autoFix) debugInfo += `⚡ *AUTO-FIX MODE*\n`;
//         debugInfo += `\n`;
        
//         // Chat Information
//         debugInfo += `📱 *CHAT INFO:*\n`;
//         debugInfo += `├─ 💬 Chat: ${chatId}\n`;
//         debugInfo += `├─ 📱 Sender: ${senderJid}\n`;
//         debugInfo += `├─ 🔧 Cleaned: ${cleaned.cleanJid}\n`;
//         debugInfo += `├─ 🔗 Type: ${cleaned.isLid ? 'LID 🔗' : 'Regular 📱'}\n`;
//         debugInfo += `├─ 📍 From Me: ${isFromMe ? '✅ YES' : '❌ NO'}\n`;
//         debugInfo += `└─ 💬 Chat Type: ${chatId.includes('@g.us') ? 'Group 👥' : 'DM 📱'}\n\n`;
        
//         // LID Analysis
//         if (cleaned.isLid) {
//             debugInfo += `🔗 *LID ANALYSIS:*\n`;
//             debugInfo += `├─ LID Number: ${cleaned.cleanNumber}\n`;
//             debugInfo += `├─ Length: ${cleaned.cleanNumber.length} digits\n`;
            
//             // Check if this LID could be derived from your number
//             if (ownerCleanNumber !== 'Not set') {
//                 const ownerLast9 = ownerCleanNumber.slice(-9);
//                 const lidLast9 = cleaned.cleanNumber.slice(-9);
//                 const possibleMatch = lidLast9.includes(ownerLast9) || ownerLast9.includes(lidLast9);
                
//                 debugInfo += `├─ Owner last 9: ${ownerLast9}\n`;
//                 debugInfo += `├─ LID last 9: ${lidLast9}\n`;
//                 debugInfo += `└─ Possible match: ${possibleMatch ? '🔍 Maybe' : '❌ No'}\n`;
//             }
//             debugInfo += `\n`;
//         }
        
//         // Owner Information
//         debugInfo += `👑 *OWNER INFO:*\n`;
//         debugInfo += `├─ 📁 File: ${ownerFileExists ? '✅' : '❌'}\n`;
//         debugInfo += `├─ 📞 Number: ${ownerCleanNumber}\n`;
//         debugInfo += `├─ 🔗 JID: ${ownerCleanJid}\n`;
//         debugInfo += `└─ 🆔 Type: ${ownerCleanJid?.includes('@lid') ? 'LID 🔗' : 'Regular 📱'}\n\n`;
        
//         // jidManager Status
//         const ownerInfo = jidManager.getOwnerInfo();
//         debugInfo += `🔧 *JID MANAGER STATUS:*\n`;
//         debugInfo += `├─ Owner set: ${ownerInfo.cleanNumber ? '✅ YES' : '❌ NO'}\n`;
//         debugInfo += `├─ Clean Number: ${ownerInfo.cleanNumber || 'Not set'}\n`;
//         debugInfo += `└─ Clean JID: ${ownerInfo.cleanJid || 'Not set'}\n\n`;
        
//         // Owner Status Analysis
//         debugInfo += `✅ *OWNER STATUS ANALYSIS:*\n`;
//         debugInfo += `├─ isOwner(): ${isOwner ? '✅ YES' : '❌ NO'}\n`;
//         debugInfo += `├─ fromMe: ${isFromMe ? '✅ YES' : '❌ NO'}\n`;
        
//         // Check why isOwner() returns what it does
//         if (isFromMe && isOwner) {
//             debugInfo += `└─ 🔍 Reason: Bot sees message as from itself (fromMe=true)\n`;
//         } else if (!isFromMe && !isOwner) {
//             debugInfo += `└─ 🔍 Reason: Not from bot and not matching owner data\n`;
//         } else if (isFromMe && !isOwner) {
//             debugInfo += `└─ ⚠️ WARNING: fromMe=true but isOwner=false!\n`;
//         }
//         debugInfo += `\n`;
        
//         // Global Variables Status
//         debugInfo += `⚙️ *GLOBAL VARIABLES STATUS:*\n`;
//         debugInfo += `├─ OWNER_NUMBER: ${global.OWNER_NUMBER ? '✅ Set' : '❌ Not set'}\n`;
//         debugInfo += `├─ OWNER_CLEAN_NUMBER: ${global.OWNER_CLEAN_NUMBER ? '✅ Set' : '❌ Not set'}\n`;
//         debugInfo += `├─ OWNER_JID: ${global.OWNER_JID ? '✅ Set' : '❌ Not set'}\n`;
//         debugInfo += `└─ OWNER_CLEAN_JID: ${global.OWNER_CLEAN_JID ? '✅ Set' : '❌ Not set'}\n\n`;
        
//         // Initialization Results
//         if (initActions.length > 0) {
//             debugInfo += `🔧 *INITIALIZATION ACTIONS:*\n`;
//             initActions.forEach(action => {
//                 debugInfo += `├─ ${action}\n`;
//             });
//             debugInfo += `\n`;
//         }
        
//         // THE FIX: For LID + fromMe messages
//         if (cleaned.isLid && isFromMe) {
//             debugInfo += `🎯 *SPECIAL LID FIX AVAILABLE:*\n`;
//             debugInfo += `This message is from a linked device (LID) and from the bot itself.\n`;
//             debugInfo += `This means YOU are controlling the bot from this device.\n\n`;
            
//             debugInfo += `💡 *QUICK FIX:* Use this command to grant owner access:\n`;
//             debugInfo += `${PREFIX}lidowner\n\n`;
//         }
        
//         // Recommendations
//         debugInfo += `💡 *RECOMMENDATIONS:*\n`;
        
//         if (!ownerInfo.cleanNumber) {
//             debugInfo += `1. Run ${PREFIX}debugchat fix to initialize jidManager\n`;
//         }
        
//         if (!global.OWNER_NUMBER) {
//             debugInfo += `2. Run ${PREFIX}debugchat fix to set global variables\n`;
//         }
        
//         if (cleaned.isLid && isFromMe) {
//             debugInfo += `3. Use ${PREFIX}lidowner to grant owner access to this LID\n`;
//         }
        
//         debugInfo += `4. Check if jidManager.isOwner() checks fromMe properly\n`;
//         debugInfo += `5. Restart bot after fixes\n`;
        
//         await sock.sendMessage(chatId, {
//             text: debugInfo
//         });
        
//         // Critical fix suggestion for someone else's DM
//         if (cleaned.isLid && isFromMe && !isOwner && !chatId.includes('@g.us')) {
//             setTimeout(async () => {
//                 await sock.sendMessage(chatId, {
//                     text: `⚠️ *CRITICAL ISSUE DETECTED*\n\nYou're messaging from a linked device in someone else's DM.\nThe bot sees "fromMe: true" but doesn't recognize you as owner.\n\n🚨 *EMERGENCY FIX:* Use ${PREFIX}forceownerlid`
//                 });
//             }, 1000);
//         }
        
//         console.log(`
// ╔════════════════════════════════════════════════╗
// ├◆                LID DEBUG ANALYSIS              ║
// ╠════════════════════════════════════════════════╣
// ├◆ Chat: ${chatId.includes('@g.us') ? 'Group' : 'DM'}
// ├◆ Sender: ${senderJid}
// ├◆ Type: LID (Linked Device)
// ├◆ fromMe: ${isFromMe}
// ├◆ isOwner(): ${isOwner}
// ├◆ jidManager Owner: ${ownerInfo.cleanNumber ? 'SET' : 'NOT SET'}
// ├◆ Issue: ${isFromMe && !isOwner ? 'CRITICAL' : 'Normal'}
// ╚════════════════════════════════════════════════╝
// `);
//     }
// };
















// File: ./commands/owner/debugchat.js
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for proper path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'debugchat',
    alias: ['chatinfo', 'debugjid', 'fixjid', 'chatdebug'],
    category: 'owner',
    description: 'Comprehensive debug tool for JID/LID analysis and fixing owner.json data issues',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const participant = msg.key.participant;
        const senderJid = participant || msg.key.fromMe ? sock.user?.id || chatId : participant || chatId;
        const { jidManager } = extra;
        const isFromMe = msg.key.fromMe || false;
        
        // Get cleaned JID information
        const cleaned = jidManager.cleanJid(senderJid);
        const isOwner = jidManager.isOwner(msg);
        
        // Command arguments parsing
        const autoFix = args[0]?.toLowerCase() === 'fix' || args[0]?.toLowerCase() === 'auto';
        const verbose = args.includes('-v') || args.includes('--verbose');
        const resetMode = args[0]?.toLowerCase() === 'reset' || args.includes('--reset');
        
        // Initialize debug information storage
        let debugInfo = `🔍 *CHAT DEBUG INFORMATION*\n`;
        if (autoFix) debugInfo += `⚡ *AUTO-FIX MODE ENABLED*\n`;
        if (resetMode) debugInfo += `🔄 *RESET MODE ENABLED*\n`;
        debugInfo += `Generated: ${new Date().toLocaleString()}\n`;
        debugInfo += `Command: \`${PREFIX}${this.name} ${args.join(' ')}\`\n\n`;
        
        const actionsTaken = [];
        const errorsDetected = [];
        const warnings = [];
        
        // 1. FILE SYSTEM ANALYSIS
        debugInfo += `📁 *FILE SYSTEM ANALYSIS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        const ownerJsonPath = path.join(process.cwd(), 'owner.json');
        const configJsonPath = path.join(process.cwd(), 'config.json');
        const dataDirPath = path.join(process.cwd(), 'data');
        
        let ownerData = {};
        let ownerFileExists = existsSync(ownerJsonPath);
        let configFileExists = existsSync(configJsonPath);
        let dataDirExists = existsSync(dataDirPath);
        
        debugInfo += `├─ owner.json: ${ownerFileExists ? '✅ Found' : '❌ Missing'}\n`;
        debugInfo += `├─ config.json: ${configFileExists ? '✅ Found' : '❌ Missing'}\n`;
        debugInfo += `└─ data/ directory: ${dataDirExists ? '✅ Found' : '❌ Missing'}\n\n`;
        
        // Read and parse owner.json with enhanced error handling
        if (ownerFileExists) {
            try {
                const fileContent = readFileSync(ownerJsonPath, 'utf8');
                if (fileContent.trim() === '') {
                    ownerData = {};
                    warnings.push('owner.json is empty');
                } else {
                    ownerData = JSON.parse(fileContent);
                }
                
                // Validate structure
                const requiredFields = ['OWNER_NUMBER', 'OWNER_JID'];
                const missingFields = requiredFields.filter(field => !ownerData[field]);
                
                if (missingFields.length > 0) {
                    errorsDetected.push(`Missing fields in owner.json: ${missingFields.join(', ')}`);
                }
                
            } catch (error) {
                errorsDetected.push(`Failed to parse owner.json: ${error.message}`);
                ownerFileExists = false;
            }
        }
        
        // Extract owner information with safe defaults
        let ownerNumber = ownerData.OWNER_NUMBER || 'Not set';
        let ownerJid = ownerData.OWNER_JID || 'Not set';
        let ownerCleanNumber = ownerData.OWNER_CLEAN_NUMBER || 'Not set';
        let ownerCleanJid = ownerData.OWNER_CLEAN_JID || 'Not set';
        
        // Normalize JID formats
        if (ownerJid && ownerJid.includes(':74')) {
            ownerJid = ownerJid.replace(':74@s.whatsapp.net', '@s.whatsapp.net');
            actionsTaken.push('Fixed :74 suffix in owner JID');
        }
        
        if (ownerNumber && ownerNumber.includes(':')) {
            ownerNumber = ownerNumber.split(':')[0];
            actionsTaken.push('Removed port from owner number');
        }
        
        // 2. JID MANAGER ANALYSIS
        debugInfo += `🔧 *JID MANAGER ANALYSIS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        const jidManagerMethods = [
            'cleanJid',
            'isOwner', 
            'getOwnerInfo',
            'setOwner',
            'addOwner'
        ];
        
        const availableMethods = jidManagerMethods.filter(method => typeof jidManager[method] === 'function');
        const missingMethods = jidManagerMethods.filter(method => typeof jidManager[method] !== 'function');
        
        debugInfo += `├─ Methods available: ${availableMethods.length}/${jidManagerMethods.length}\n`;
        if (missingMethods.length > 0) {
            debugInfo += `├─ Missing: ${missingMethods.join(', ')}\n`;
            warnings.push(`jidManager missing methods: ${missingMethods.join(', ')}`);
        }
        
        const ownerInfo = jidManager.getOwnerInfo ? jidManager.getOwnerInfo() : {};
        
        debugInfo += `├─ Owner set in manager: ${ownerInfo.cleanNumber ? '✅ Yes' : '❌ No'}\n`;
        debugInfo += `├─ Clean Number: ${ownerInfo.cleanNumber || 'Not set'}\n`;
        debugInfo += `├─ Clean JID: ${ownerInfo.cleanJid || 'Not set'}\n`;
        debugInfo += `└─ Raw JID: ${ownerInfo.rawJid || 'Not set'}\n\n`;
        
        // 3. CHAT AND SENDER ANALYSIS
        debugInfo += `📱 *CHAT & SENDER ANALYSIS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        // Determine chat type
        let chatType = 'Unknown';
        if (chatId?.endsWith('@g.us')) chatType = 'Group 👥';
        else if (chatId?.endsWith('@s.whatsapp.net')) chatType = 'DM 📱';
        else if (chatId?.endsWith('@broadcast')) chatType = 'Broadcast 📢';
        else if (chatId?.includes('@lid')) chatType = 'Linked Device 🔗';
        
        debugInfo += `├─ Chat ID: ${chatId}\n`;
        debugInfo += `├─ Chat Type: ${chatType}\n`;
        debugInfo += `├─ Sender JID: ${senderJid}\n`;
        debugInfo += `├─ Participant: ${participant || 'None (DM)'}\n`;
        debugInfo += `├─ From Me: ${isFromMe ? '✅ Yes' : '❌ No'}\n`;
        debugInfo += `├─ Is Owner: ${isOwner ? '✅ Yes' : '❌ No'}\n`;
        
        // Detailed JID cleaning analysis
        debugInfo += `└─ *Cleaned Analysis:*\n`;
        debugInfo += `   ├─ Clean JID: ${cleaned.cleanJid}\n`;
        debugInfo += `   ├─ Clean Number: ${cleaned.cleanNumber}\n`;
        debugInfo += `   ├─ Is LID: ${cleaned.isLid ? '✅ Yes 🔗' : '❌ No'}\n`;
        debugInfo += `   └─ Number Length: ${cleaned.cleanNumber?.length || 0} digits\n\n`;
        
        // 4. LID-SPECIFIC ANALYSIS
        if (cleaned.isLid) {
            debugInfo += `🔗 *LINKED DEVICE (LID) ANALYSIS*\n`;
            debugInfo += `═`.repeat(40) + `\n`;
            
            const lidNumber = cleaned.cleanNumber;
            const lidPattern = /^(\d+)\d{9}@lid$/;
            const match = lidNumber?.match(lidPattern);
            
            debugInfo += `├─ LID Pattern: ${lidNumber?.match(/^\d+@lid$/) ? '✅ Valid' : '⚠️ Irregular'}\n`;
            
            if (match) {
                const prefix = match[1];
                const last9 = lidNumber.replace(/^(\d+)(\d{9})@lid$/, '$2');
                debugInfo += `├─ Prefix: ${prefix}\n`;
                debugInfo += `├─ Last 9 digits: ${last9}\n`;
                
                // Compare with owner number
                if (ownerCleanNumber && ownerCleanNumber !== 'Not set') {
                    const ownerLast9 = ownerCleanNumber.slice(-9);
                    const isMatch = last9 === ownerLast9;
                    const isPartialMatch = last9.includes(ownerLast9) || ownerLast9.includes(last9);
                    
                    debugInfo += `├─ Owner last 9: ${ownerLast9}\n`;
                    debugInfo += `├─ Exact match: ${isMatch ? '✅ Yes' : '❌ No'}\n`;
                    debugInfo += `└─ Partial match: ${isPartialMatch ? '🔍 Possible' : '❌ No'}\n`;
                    
                    if (!isMatch && isPartialMatch) {
                        warnings.push('Partial LID match detected - may indicate cross-linked device');
                    }
                }
            }
            debugInfo += `\n`;
        }
        
        // 5. GLOBAL VARIABLES CHECK
        debugInfo += `⚙️ *GLOBAL VARIABLES STATUS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        const globalVars = [
            'OWNER_NUMBER',
            'OWNER_CLEAN_NUMBER', 
            'OWNER_JID',
            'OWNER_CLEAN_JID',
            'OWNER_NAME',
            'BOT_NAME',
            'PREFIX'
        ];
        
        globalVars.forEach(varName => {
            const exists = global[varName] !== undefined;
            const value = global[varName];
            const displayValue = exists ? 
                (typeof value === 'string' && value.length > 20 ? 
                    `${value.substring(0, 20)}...` : 
                    String(value)) : 
                '❌ Not set';
            
            debugInfo += `├─ ${varName}: ${exists ? '✅' : '❌'} ${displayValue}\n`;
        });
        debugInfo += `\n`;
        
        // 6. AUTO-FIX LOGIC
        if (autoFix || resetMode) {
            debugInfo += `🔧 *REPAIR ACTIONS*\n`;
            debugInfo += `═`.repeat(40) + `\n`;
            
            try {
                // Step 1: Fix owner.json if needed
                if (ownerFileExists) {
                    const updates = {};
                    
                    // Ensure clean versions exist
                    if (ownerNumber && ownerNumber !== 'Not set' && !ownerCleanNumber) {
                        ownerCleanNumber = ownerNumber.replace(/\D/g, '');
                        updates.OWNER_CLEAN_NUMBER = ownerCleanNumber;
                    }
                    
                    if (ownerJid && ownerJid !== 'Not set' && !ownerCleanJid) {
                        ownerCleanJid = ownerJid.replace(/:74@s\.whatsapp\.net$/, '@s.whatsapp.net');
                        updates.OWNER_CLEAN_JID = ownerCleanJid;
                    }
                    
                    // Add timestamp
                    updates.lastUpdated = new Date().toISOString();
                    updates.lastUpdatedBy = 'debugchat command';
                    
                    // Merge updates
                    ownerData = { ...ownerData, ...updates };
                    
                    // Write back to file
                    writeFileSync(ownerJsonPath, JSON.stringify(ownerData, null, 2));
                    actionsTaken.push('Updated owner.json with clean JID/number');
                    
                    debugInfo += `├─ ✅ Updated owner.json\n`;
                }
                
                // Step 2: Initialize jidManager
                if (jidManager.setOwner && ownerCleanNumber && ownerCleanJid) {
                    try {
                        const result = jidManager.setOwner({
                            rawNumber: ownerCleanNumber,
                            rawJid: ownerCleanJid
                        });
                        
                        if (result?.success !== false) {
                            actionsTaken.push('Initialized jidManager owner data');
                            debugInfo += `├─ ✅ Set jidManager owner\n`;
                        }
                    } catch (error) {
                        debugInfo += `├─ ⚠️ jidManager.setOwner failed: ${error.message}\n`;
                    }
                }
                
                // Step 3: Set global variables
                if (ownerCleanNumber) {
                    global.OWNER_NUMBER = ownerNumber;
                    global.OWNER_CLEAN_NUMBER = ownerCleanNumber;
                    global.OWNER_JID = ownerJid;
                    global.OWNER_CLEAN_JID = ownerCleanJid;
                    actionsTaken.push('Set global owner variables');
                    debugInfo += `├─ ✅ Set global variables\n`;
                }
                
                // Step 4: Reset mode specific actions
                if (resetMode) {
                    // Clear any cached owner data
                    if (jidManager.resetOwner) {
                        jidManager.resetOwner();
                        actionsTaken.push('Reset jidManager owner cache');
                        debugInfo += `├─ ✅ Reset jidManager cache\n`;
                    }
                    
                    // Force re-check on next message
                    if (jidManager.owner) {
                        delete jidManager.owner;
                    }
                }
                
                debugInfo += `└─ 🔄 Repair completed\n\n`;
                
            } catch (error) {
                errorsDetected.push(`Auto-fix failed: ${error.message}`);
                debugInfo += `└─ ❌ Repair failed: ${error.message}\n\n`;
            }
        }
        
        // 7. ISSUE DIAGNOSIS
        debugInfo += `⚠️ *ISSUE DIAGNOSIS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        const issues = [];
        
        // Check 1: Owner recognition
        if (isFromMe && !isOwner) {
            issues.push(`🚨 CRITICAL: Bot sees message as from itself but doesn't recognize as owner`);
        }
        
        // Check 2: JID Manager status
        if (!ownerInfo.cleanNumber) {
            issues.push(`⚠️ jidManager doesn't have owner data initialized`);
        }
        
        // Check 3: File consistency
        if (ownerFileExists && !ownerData.OWNER_CLEAN_NUMBER) {
            issues.push(`⚠️ owner.json missing clean number field`);
        }
        
        // Check 4: Global variables
        if (!global.OWNER_NUMBER) {
            issues.push(`⚠️ Global OWNER_NUMBER not set`);
        }
        
        // Check 5: LID specific issues
        if (cleaned.isLid && !isOwner && isFromMe) {
            issues.push(`🔗 LID device detected but not recognized as owner`);
        }
        
        if (issues.length > 0) {
            issues.forEach((issue, index) => {
                debugInfo += `${index === issues.length - 1 ? '└─' : '├─'} ${issue}\n`;
            });
        } else {
            debugInfo += `└─ ✅ No critical issues detected\n`;
        }
        debugInfo += `\n`;
        
        // 8. RECOMMENDATIONS
        debugInfo += `💡 *RECOMMENDATIONS*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        
        const recommendations = [];
        
        if (!ownerInfo.cleanNumber) {
            recommendations.push(`Run \`${PREFIX}debugchat fix\` to initialize jidManager`);
        }
        
        if (cleaned.isLid && isFromMe && !isOwner) {
            recommendations.push(`Use \`${PREFIX}lidowner\` to grant owner access to this LID`);
            recommendations.push(`Or use \`${PREFIX}forceownerlid\` for emergency LID owner assignment`);
        }
        
        if (!ownerFileExists) {
            recommendations.push(`Create owner.json file with your WhatsApp number`);
        }
        
        if (errorsDetected.length > 0) {
            recommendations.push(`Check console for detailed error logs`);
        }
        
        recommendations.push(`Restart bot after applying fixes`);
        recommendations.push(`Verify with \`${PREFIX}ping\` and \`${PREFIX}owner\` commands`);
        
        recommendations.forEach((rec, index) => {
            debugInfo += `${index === recommendations.length - 1 ? '└─' : '├─'} ${rec}\n`;
        });
        
        // 9. SUMMARY SECTION
        debugInfo += `\n📊 *SUMMARY*\n`;
        debugInfo += `═`.repeat(40) + `\n`;
        debugInfo += `├─ Actions Taken: ${actionsTaken.length}\n`;
        debugInfo += `├─ Warnings: ${warnings.length}\n`;
        debugInfo += `├─ Errors: ${errorsDetected.length}\n`;
        debugInfo += `├─ Issues Found: ${issues.length}\n`;
        debugInfo += `└─ Recommendations: ${recommendations.length}\n\n`;
        
        // 10. QUICK FIX COMMANDS
        if (cleaned.isLid && isFromMe) {
            debugInfo += `⚡ *QUICK FIX FOR THIS LID*\n`;
            debugInfo += `═`.repeat(40) + `\n`;
            debugInfo += `To fix owner recognition for this linked device:\n\n`;
            debugInfo += `1. \`${PREFIX}lidowner\` - Normal LID owner assignment\n`;
            debugInfo += `2. \`${PREFIX}forceownerlid\` - Force owner assignment\n`;
            debugInfo += `3. \`${PREFIX}debugchat fix\` - General repair\n\n`;
        }
        
        // Send debug information
        try {
            await sock.sendMessage(chatId, {
                text: debugInfo
            });
            
            // Send additional critical alerts if needed
            if (cleaned.isLid && isFromMe && !isOwner) {
                setTimeout(async () => {
                    await sock.sendMessage(chatId, {
                        text: `🚨 *CRITICAL ALERT*\n\nYou're using a linked device that the bot doesn't recognize as owner.\nThe bot sees your messages as "fromMe: true" but isOwner() returns false.\n\nImmediate action required:\n1. Use \`${PREFIX}forceownerlid\`\n2. Restart the bot\n3. Verify with \`${PREFIX}ping\``
                    });
                }, 1500);
            }
            
        } catch (sendError) {
            console.error('Failed to send debug info:', sendError);
        }
        
        // Console logging for server-side analysis
        console.log(`
┌─⧭ DEBUGCHAT ANALYSIS REPORT

├──────────────────────────────────────────────────────────────
├◆ 📅 Timestamp: ${new Date().toISOString()}
├◆ 💬 Chat: ${chatType}
├◆ 👤 Sender: ${senderJid}
├◆ 🔗 Type: ${cleaned.isLid ? 'Linked Device (LID)' : 'Standard JID'}
├◆ 🤖 From Me: ${isFromMe}
├◆ 👑 Is Owner: ${isOwner}
├◆ 📁 Owner File: ${ownerFileExists ? 'Exists' : 'Missing'}
├◆ 🛠️  jidManager: ${ownerInfo.cleanNumber ? 'Initialized' : 'Not Initialized'}
├◆ ⚠️  Issues: ${issues.length > 0 ? issues.join('; ') : 'None'}
└─⧭
`);
        
        // Log detailed errors to console
        if (errorsDetected.length > 0) {
            console.error('❌ Errors detected:', errorsDetected);
        }
        if (warnings.length > 0) {
            console.warn('⚠️  Warnings:', warnings);
        }
        if (actionsTaken.length > 0) {
            console.log('✅ Actions taken:', actionsTaken);
        }
    }
};
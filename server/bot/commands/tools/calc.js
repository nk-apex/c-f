// commands/tools/calc.js
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'calc',
    alias: ['calculate', 'math', 'calculator'],
    category: 'tools',
    description: 'Simple calculator',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'calc')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const expression = args.join(' ');
        
        if (!expression) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🧮 *FOX CALCULATOR* 🦊\n\n` +
                      `Usage: ${prefix}calc <expression>\n\n` +
                      `*Supported Operations:*\n` +
                      `• Addition: 5 + 3\n` +
                      `• Subtraction: 10 - 4\n` +
                      `• Multiplication: 6 * 7\n` +
                      `• Division: 15 / 3\n` +
                      `• Power: 2 ^ 3\n` +
                      `• Square root: sqrt(16)\n` +
                      `• Percentage: 20% of 150\n\n` +
                      `*Examples:*\n` +
                      `${prefix}calc 5 + 3 * 2\n` +
                      `${prefix}calc (10 + 5) / 3\n` +
                      `${prefix}calc 20% of 200\n\n` +
                      `💡 *Use parentheses for complex calculations!*\n\n` +
                      `🦊 Let me do the math!`
            });
            return;
        }
        
        try {
            // Safe evaluation
            let result = expression;
            
            // Replace common math symbols
            result = result.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
            
            // Handle percentage
            if (result.includes('% of')) {
                const parts = result.split('% of');
                const percent = parseFloat(parts[0].trim());
                const number = parseFloat(parts[1].trim());
                if (!isNaN(percent) && !isNaN(number)) {
                    result = (percent / 100) * number;
                }
            } else if (result.includes('%')) {
                const parts = result.split('%');
                const number = parseFloat(parts[0].trim());
                if (!isNaN(number)) {
                    result = number / 100;
                }
            }
            
            // Handle square root
            if (result.startsWith('sqrt(') && result.endsWith(')')) {
                const num = parseFloat(result.slice(5, -1));
                if (!isNaN(num)) {
                    result = Math.sqrt(num);
                }
            }
            
            // If still a string, try eval with safety
            if (typeof result === 'string') {
                // Remove any dangerous characters
                const safeExpr = result.replace(/[^0-9+\-*/().%^ ]/g, '');
                result = eval(safeExpr);
            }
            
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            
            // Format result
            let formattedResult;
            if (Number.isInteger(result)) {
                formattedResult = result.toString();
            } else {
                formattedResult = parseFloat(result.toFixed(6)).toString();
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🧮 *CALCULATION RESULT* 🦊\n\n` +
                      `*Expression:* ${expression}\n` +
                      `*Result:* ${formattedResult}\n\n` +
                      `*Detailed:*\n` +
                      `• Input: ${expression}\n` +
                      `• Output: ${formattedResult}\n` +
                      `• Type: ${typeof result}\n\n` +
                      `💡 *Need another calculation?*\n` +
                      `Use: ${prefix}calc <expression>\n\n` +
                      `🦊 Math solved by fox intelligence!`
            });
            
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *CALCULATION ERROR* 🦊\n\n` +
                      `*Expression:* ${expression}\n` +
                      `*Error:* Invalid mathematical expression\n\n` +
                      `*Common mistakes:*\n` +
                      `• Missing operators\n` +
                      `• Unbalanced parentheses\n` +
                      `• Invalid characters\n\n` +
                      `*Example format:*\n` +
                      `${prefix}calc 5 + 3 * 2\n\n` +
                      `🦊 Even foxes make calculation errors!`
            });
        }
    }
};
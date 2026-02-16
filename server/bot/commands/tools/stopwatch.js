// commands/tools/stopwatch-fixed.js
export default {
    name: "stopwatch",
    alias: ["timer", "countdown", "sw"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        // Initialize storage if not exists
        if (!global.timers) global.timers = {};
        
        // Handle stop command
        const subcommand = args[0]?.toLowerCase();
        if (subcommand === 'stop' || subcommand === 'end' || subcommand === 'cancel') {
            if (global.timers[jid]) {
                clearInterval(global.timers[jid].interval);
                delete global.timers[jid];
                return sock.sendMessage(jid, {
                    text: `⏱️ *STOPWATCH STOPPED*\n\nTimer has been cancelled.`
                }, { quoted: m });
            }
            return sock.sendMessage(jid, {
                text: `❌ No active timer found`
            }, { quoted: m });
        }
        
        // Handle list command
        if (subcommand === 'list' || subcommand === 'active') {
            if (global.timers[jid]) {
                const timer = global.timers[jid];
                const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
                const remaining = timer.duration - elapsed;
                
                return sock.sendMessage(jid, {
                    text: `⏱️ *ACTIVE TIMER*\n\n` +
                          `Duration: ${formatTime(timer.duration)}\n` +
                          `Elapsed: ${formatTime(elapsed)}\n` +
                          `Remaining: ${formatTime(remaining)}\n\n` +
                          `Stop with: ${PREFIX}stopwatch stop`
                }, { quoted: m });
            }
            return sock.sendMessage(jid, {
                text: `❌ No active timer`
            }, { quoted: m });
        }
        
        // Parse time input
        let seconds = 60; // Default 1 minute
        
        if (args.length > 0) {
            const timeStr = args[0].toLowerCase();
            if (timeStr.includes('m')) {
                seconds = parseInt(timeStr) * 60;
            } else if (timeStr.includes('h')) {
                seconds = parseInt(timeStr) * 3600;
            } else if (timeStr.includes('s')) {
                seconds = parseInt(timeStr);
            } else {
                seconds = parseInt(timeStr) || 60;
            }
            
            // Limits
            if (seconds > 3600 * 24) seconds = 3600 * 24; // Max 24 hours
            if (seconds < 1) seconds = 1;
        }
        
        // Check if timer already exists
        if (global.timers[jid]) {
            return sock.sendMessage(jid, {
                text: `❌ Timer already running!\n\n` +
                      `Stop it first: ${PREFIX}stopwatch stop\n` +
                      `Check status: ${PREFIX}stopwatch list`
            }, { quoted: m });
        }
        
        try {
            // Send ONE initial message
            const initialMsg = await sock.sendMessage(jid, {
                text: `⏱️ *TIMER STARTED*\n\n` +
                      `Duration: ${formatTime(seconds)}\n` +
                      `Status: Running...\n\n` +
                      `Stop: ${PREFIX}stopwatch stop`
            });
            
            const messageKey = initialMsg.key;
            const startTime = Date.now();
            const endTime = startTime + (seconds * 1000);
            
            // Store timer
            global.timers[jid] = {
                interval: null,
                startTime: startTime,
                duration: seconds,
                messageKey: messageKey
            };
            
            // Create interval to update the SINGLE message
            const interval = setInterval(async () => {
                const now = Date.now();
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = seconds - elapsed;
                
                if (remaining <= 0) {
                    // Timer finished
                    clearInterval(interval);
                    delete global.timers[jid];
                    
                    // Update final message
                    try {
                        await sock.sendMessage(jid, {
                            text: `🔔 *TIMER COMPLETE!*\n\n` +
                                  `Duration: ${formatTime(seconds)}\n` +
                                  `Status: ✅ Finished!\n\n` +
                                  `⏰ Time's up!`,
                            edit: messageKey
                        });
                    } catch (error) {
                        console.log("Couldn't edit final message");
                    }
                    
                    // Optional: Send completion sound/notification
                    setTimeout(async () => {
                        await sock.sendMessage(jid, {
                            text: `⏰ Timer for ${formatTime(seconds)} completed!`
                        });
                    }, 100);
                    
                    return;
                }
                
                // Update the existing message (no new messages)
                try {
                    await sock.sendMessage(jid, {
                        text: `⏱️ *TIMER RUNNING*\n\n` +
                              `Duration: ${formatTime(seconds)}\n` +
                              `Elapsed: ${formatTime(elapsed)}\n` +
                              `Remaining: ${formatTime(remaining)}\n` +
                              `Progress: ${getProgressBar(remaining, seconds)}\n\n` +
                              `Stop: ${PREFIX}stopwatch stop`,
                        edit: messageKey
                    });
                } catch (editError) {
                    // If edit fails (message deleted), stop timer
                    clearInterval(interval);
                    delete global.timers[jid];
                }
            }, 1000); // Update every second
            
            // Save interval reference
            global.timers[jid].interval = interval;
            
        } catch (error) {
            console.error("Stopwatch error:", error);
            await sock.sendMessage(jid, {
                text: `❌ Failed to start timer\n\n` +
                      `Try: ${PREFIX}stopwatch 30s\n` +
                      `Or: ${PREFIX}stopwatch 5m`
            }, { quoted: m });
        }
    }
};

// Helper functions
function formatTime(seconds) {
    if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    } else if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    } else {
        return `${seconds}s`;
    }
}

function getProgressBar(current, total) {
    const width = 10;
    const percentage = (current / total) * 100;
    const filled = Math.round((width * (100 - percentage)) / 100);
    const empty = width - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(100 - percentage)}%`;
}
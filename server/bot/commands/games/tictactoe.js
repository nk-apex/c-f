// commands/tictactoe.js - Tic-Tac-Toe Game
import { TicTacToeGame } from '../games/tictactoe-game.js';

export default {
    name: 'tictactoe',
    description: 'Play Tic-Tac-Toe against Foxy AI or friends!',
    category: 'games',
    aliases: ['ttt', 'xo', 'tic', 'foxytt', 'foxymove'],
    
    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const userId = sender.split('@')[0];
        const userName = m.pushName || 'Player';
        const userMessage = m.message?.conversation || '';
        
        // ===== DETECT NUMBER-ONLY MESSAGES AS MOVES =====
        const trimmedMsg = userMessage.trim();
        const moveNumber = parseInt(trimmedMsg);
        
        if (!isNaN(moveNumber) && moveNumber >= 1 && moveNumber <= 9) {
            // User sent just a number 1-9, check if there's an active game
            if (global.tttGames && global.tttGames.has(jid)) {
                const game = global.tttGames.get(jid);
                
                // Check if it's this player's turn
                let isPlayersTurn = false;
                
                if (game.isVsAI) {
                    // Playing against AI
                    isPlayersTurn = (game.currentPlayer === userId);
                } else {
                    // Playing against another human
                    isPlayersTurn = (game.currentPlayer === userId);
                }
                
                if (isPlayersTurn) {
                    // Treat the number as a move command
                    args = ['move', moveNumber.toString()];
                } else {
                    // Not their turn
                    const currentPlayerName = game.isVsAI ? 
                        'Foxy AI' : 
                        (game.currentPlayer === game.player1.id ? game.player1.name : game.player2.name);
                    
                    return sock.sendMessage(jid, {
                        text: `⏳ Not your turn!\n\n` +
                              `It's ${currentPlayerName}'s turn right now.\n` +
                              `Wait for them to make a move.`
                    }, { quoted: m });
                }
            }
        }
        
        // ===== CHECK FOR EMPTY COMMAND =====
        if (args.length === 0) {
            // Check if there's an active game
            if (global.tttGames && global.tttGames.has(jid)) {
                const game = global.tttGames.get(jid);
                const boardText = game.getBoardAsText();
                const status = game.getGameStatus();
                
                return sock.sendMessage(jid, {
                    text: `🎮 *ACTIVE TIC-TAC-TOE GAME*\n\n` +
                          `${status}\n\n` +
                          `${boardText}\n\n` +
                          `*To make a move:*\n` +
                          `Type: \`${PREFIX}ttt move [1-9]\`\n` +
                          `Or just type a number 1-9\n\n` +
                          `*Other commands:*\n` +
                          `• ${PREFIX}ttt board - Show board\n` +
                          `• ${PREFIX}ttt quit - End game\n` +
                          `• ${PREFIX}ttt help - Full instructions`
                }, { quoted: m });
            } else {
                // No active game, show help
                args = ['help'];
            }
        }
        
        const command = args[0].toLowerCase();
        
        // ===== HELP COMMAND =====
        if (command === 'help') {
            const stats = global.tttGames ? 
                `Active games: ${global.tttGames.size}` : 
                'No active games';
            
            return sock.sendMessage(jid, {
                text: `🎮 *TIC-TAC-TOE GAME COMMANDS*\n\n` +
                      `*Challenge me or play with friends!*\n\n` +
                      `📖 **MAIN COMMANDS:**\n` +
                      `• ${PREFIX}ttt start - Start new game vs AI\n` +
                      `• ${PREFIX}ttt vs @friend - Challenge a friend\n` +
                      `• ${PREFIX}ttt move [1-9] - Make a move\n` +
                      `• ${PREFIX}ttt board - Show current board\n` +
                      `• ${PREFIX}ttt quit - Quit current game\n` +
                      `• ${PREFIX}ttt help - Show this help\n\n` +
                      `📖 **ALIASES (same commands):**\n` +
                      `• ${PREFIX}foxytt - Same as ttt\n` +
                      `• ${PREFIX}foxymove - Same as ttt move\n\n` +
                      `🎮 **HOW TO PLAY:**\n` +
                      `1. Start a game with ${PREFIX}ttt start\n` +
                      `2. When it's your turn, you can:\n` +
                      `   - Type: ${PREFIX}ttt move 5\n` +
                      `   - OR just type: 5\n` +
                      `3. First to get 3 in a row wins!\n\n` +
                      `🔢 **BOARD LAYOUT:**\n` +
                      `1️⃣ 2️⃣ 3️⃣\n` +
                      `4️⃣ 5️⃣ 6️⃣\n` +
                      `7️⃣ 8️⃣ 9️⃣\n\n` +
                      `📊 **Current Status:** ${stats}\n\n` +
                      `🦊 *May the best fox win!*`
            }, { quoted: m });
        }
        
        // ===== START NEW GAME =====
        if (command === 'start') {
            // Check if already has active game
            if (global.tttGames && global.tttGames.has(jid)) {
                const game = global.tttGames.get(jid);
                const boardText = game.getBoardAsText();
                
                return sock.sendMessage(jid, {
                    text: `❌ Game already in progress!\n\n` +
                          `${boardText}\n\n` +
                          `Finish this game first or use:\n` +
                          `${PREFIX}ttt quit`
                }, { quoted: m });
            }
            
            // Create new game vs AI
            const game = new TicTacToeGame(jid, userId, userName);
            game.isVsAI = true;
            game.aiLevel = args[1] || 'medium'; // easy, medium, hard
            
            // Save game
            if (!global.tttGames) global.tttGames = new Map();
            global.tttGames.set(jid, game);
            
            const boardText = game.getBoardAsText();
            
            return sock.sendMessage(jid, {
                text: `🦊 *NEW TIC-TAC-TOE GAME STARTED!*\n\n` +
                      `*You (❌) vs Foxy AI (⭕)*\n` +
                      `Difficulty: ${game.aiLevel.toUpperCase()}\n\n` +
                      `${boardText}\n\n` +
                      `*YOUR TURN!*\n` +
                      `Make your move by typing:\n` +
                      `\`${PREFIX}ttt move [1-9]\`\n` +
                      `*OR simply type a number 1-9*\n\n` +
                      `Example: Type "5" or "${PREFIX}ttt move 5"`
            }, { quoted: m });
        }
        
        // ===== CHALLENGE FRIEND =====
        if (command === 'vs' && args[1]) {
            // Check if already has active game
            if (global.tttGames && global.tttGames.has(jid)) {
                return sock.sendMessage(jid, {
                    text: `❌ Game already in progress!\n\n` +
                          `Finish current game first:\n` +
                          `${PREFIX}ttt quit`
                }, { quoted: m });
            }
            
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            
            if (!mentioned) {
                return sock.sendMessage(jid, {
                    text: `❌ Please mention a friend!\n\n` +
                          `Example:\n${PREFIX}ttt vs @friend\n` +
                          `or\n${PREFIX}foxytt vs @friend`
                }, { quoted: m });
            }
            
            // Check if challenging self
            if (mentioned === sender) {
                return sock.sendMessage(jid, {
                    text: `🤨 You can't challenge yourself!\n\n` +
                          `Challenge a friend instead:\n` +
                          `${PREFIX}ttt vs @friend`
                }, { quoted: m });
            }
            
            const friendId = mentioned.split('@')[0];
            const friendName = args[1].replace('@', '') || 'Friend';
            
            // Create PvP game
            const game = new TicTacToeGame(jid, userId, userName);
            game.player2 = { id: friendId, name: friendName };
            game.currentPlayer = userId; // First player starts
            game.symbols[friendId] = '⭕'; // Player 2 gets circle
            
            // Save game
            if (!global.tttGames) global.tttGames = new Map();
            global.tttGames.set(jid, game);
            
            const boardText = game.getBoardAsText();
            
            // Notify both players
            await sock.sendMessage(jid, {
                text: `🎮 *TIC-TAC-TOE CHALLENGE!*\n\n` +
                      `${userName} (❌) vs ${friendName} (⭕)\n\n` +
                      `${boardText}\n\n` +
                      `*${userName}'s turn!*\n` +
                      `Make your move by typing:\n` +
                      `\`${PREFIX}ttt move [1-9]\`\n` +
                      `*OR simply type a number 1-9*\n\n` +
                      `Example: Type "5" or "${PREFIX}ttt move 5"`
            }, { quoted: m });
            
            // DM the challenged player if in group
            if (jid.endsWith('@g.us')) {
                await sock.sendMessage(mentioned, {
                    text: `🎮 *TIC-TAC-TOE CHALLENGE!*\n\n` +
                          `You've been challenged by ${userName}!\n\n` +
                          `Go to the group and wait for your turn.\n` +
                          `When it's your turn, you can:\n` +
                          `• Type: ${PREFIX}ttt move [1-9]\n` +
                          `• OR just type a number 1-9\n\n` +
                          `Good luck! 🦊`
                });
            }
            
            return;
        }
        
        // ===== CHECK FOR EXISTING GAME =====
        if (!global.tttGames || !global.tttGames.has(jid)) {
            return sock.sendMessage(jid, {
                text: `❌ No active game found!\n\n` +
                      `Start a new game with:\n` +
                      `${PREFIX}ttt start\n` +
                      `or\n` +
                      `${PREFIX}ttt vs @friend\n\n` +
                      `Need help? Type: ${PREFIX}ttt help`
            }, { quoted: m });
        }
        
        const game = global.tttGames.get(jid);
        
        // ===== SHOW BOARD =====
        if (command === 'board') {
            const boardText = game.getBoardAsText();
            const status = game.getGameStatus();
            
            return sock.sendMessage(jid, {
                text: `🎮 *CURRENT GAME STATUS*\n\n` +
                      `${status}\n\n` +
                      `${boardText}\n\n` +
                      `*To make a move:*\n` +
                      `Type: \`${PREFIX}ttt move [1-9]\`\n` +
                      `Or just type a number 1-9\n\n` +
                      `Available positions: ${game.getAvailablePositions()}`
            }, { quoted: m });
        }
        
        // ===== QUIT GAME =====
        if (command === 'quit') {
            const players = game.isVsAI ? 
                `You vs Foxy AI` : 
                `${game.player1.name} vs ${game.player2?.name || 'Player 2'}`;
            
            global.tttGames.delete(jid);
            
            return sock.sendMessage(jid, {
                text: `🏳️ *GAME ENDED*\n\n` +
                      `Match: ${players}\n` +
                      `Moves made: ${game.moves}\n\n` +
                      `Thanks for playing! 🦊\n\n` +
                      `Start a new game with:\n${PREFIX}ttt start`
            }, { quoted: m });
        }
        
        // ===== MOVE COMMAND =====
        if (command === 'move') {
            // Check if user meant to use foxymove alias
            if (args[0].toLowerCase() === 'foxymove' && args[1]) {
                args = ['move', args[1]];
            }
            
            const position = parseInt(args[1]);
            
            // Validate position
            if (isNaN(position) || position < 1 || position > 9) {
                const availablePositions = game.getAvailablePositions();
                
                return sock.sendMessage(jid, {
                    text: `❌ Invalid move!\n\n` +
                          `Please choose position 1-9.\n\n` +
                          `🔢 *Board layout:*\n` +
                          `1️⃣ 2️⃣ 3️⃣\n` +
                          `4️⃣ 5️⃣ 6️⃣\n` +
                          `7️⃣ 8️⃣ 9️⃣\n\n` +
                          `✅ *Available positions:*\n` +
                          `${availablePositions || 'None'}\n\n` +
                          `Example commands:\n` +
                          `• ${PREFIX}ttt move 5\n` +
                          `• ${PREFIX}foxymove 5\n` +
                          `• Just type: 5`
                }, { quoted: m });
            }
            
            // Check if it's player's turn
            if (game.isVsAI) {
                if (game.currentPlayer !== userId) {
                    return sock.sendMessage(jid, {
                        text: `⏳ Not your turn!\n\n` +
                              `Wait for Foxy AI to make a move.\n\n` +
                              `Current board:\n${game.getBoardAsText()}`
                    }, { quoted: m });
                }
            } else {
                // PvP game - check whose turn
                const currentPlayerId = game.currentPlayer;
                if (currentPlayerId !== userId) {
                    const currentPlayerName = currentPlayerId === game.player1.id ? 
                        game.player1.name : game.player2.name;
                    return sock.sendMessage(jid, {
                        text: `⏳ Not your turn!\n\n` +
                              `It's ${currentPlayerName}'s turn right now.\n\n` +
                              `Current board:\n${game.getBoardAsText()}`
                    }, { quoted: m });
                }
            }
            
            // Try to make the move
            const moveResult = game.makeMove(position, userId);
            
            if (!moveResult.success) {
                const availablePositions = game.getAvailablePositions();
                
                return sock.sendMessage(jid, {
                    text: `❌ ${moveResult.message}\n\n` +
                          `🔢 *Board layout:*\n` +
                          `1️⃣ 2️⃣ 3️⃣\n` +
                          `4️⃣ 5️⃣ 6️⃣\n` +
                          `7️⃣ 8️⃣ 9️⃣\n\n` +
                          `✅ *Available positions:*\n` +
                          `${availablePositions}\n\n` +
                          `Try one of the available positions.`
                }, { quoted: m });
            }
            
            // Check for win/draw
            const gameResult = game.checkGameResult();
            
            if (gameResult.gameOver) {
                global.tttGames.delete(jid);
                
                const boardText = game.getBoardAsText();
                let resultText = '';
                
                if (gameResult.winner === 'draw') {
                    resultText = `🤝 *DRAW GAME!*\n\n` +
                                `No winner this time!\n\n`;
                } else if (gameResult.winner === userId) {
                    resultText = `🎉 *YOU WIN!*\n\n` +
                                `Congratulations ${userName}! 🏆\n\n`;
                } else if (game.isVsAI && gameResult.winner === 'AI') {
                    resultText = `🦊 *FOXY AI WINS!*\n\n` +
                                `Better luck next time! 🦊\n\n`;
                } else if (game.isVsAI) {
                    resultText = `🎉 *YOU WIN!*\n\n` +
                                `You beat the AI! 🏆\n\n`;
                } else {
                    // PvP win
                    const winnerName = gameResult.winner === game.player1.id ? 
                        game.player1.name : game.player2.name;
                    resultText = `🎉 *${winnerName.toUpperCase()} WINS!*\n\n` +
                                `Congratulations! 🏆\n\n`;
                }
                
                return sock.sendMessage(jid, {
                    text: resultText +
                          `${boardText}\n\n` +
                          `Total moves: ${game.moves}\n\n` +
                          `Play again: ${PREFIX}ttt start`
                }, { quoted: m });
            }
            
            // Game continues
            let nextMessage = '';
            const boardText = game.getBoardAsText();
            
            if (game.isVsAI) {
                // AI's turn
                game.currentPlayer = 'AI';
                
                // Send thinking message
                await sock.sendMessage(jid, {
                    text: `🦊 *Foxy AI is thinking...*`
                });
                
                // AI makes move (with delay for realism)
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const aiMove = game.makeAIMove();
                const aiResult = game.checkGameResult();
                
                if (aiResult.gameOver) {
                    global.tttGames.delete(jid);
                    
                    let aiResultText = '';
                    if (aiResult.winner === 'draw') {
                        aiResultText = `🤝 *DRAW GAME!*\n\n` +
                                      `No winner this time!\n\n`;
                    } else if (aiResult.winner === 'AI') {
                        aiResultText = `🦊 *FOXY AI WINS!*\n\n` +
                                      `Better luck next time! 🦊\n\n`;
                    } else {
                        aiResultText = `🎉 *YOU WIN!*\n\n` +
                                      `You beat the AI! 🏆\n\n`;
                    }
                    
                    return sock.sendMessage(jid, {
                        text: aiResultText +
                              `${game.getBoardAsText()}\n\n` +
                              `AI moved to position ${aiMove}\n` +
                              `Total moves: ${game.moves}\n\n` +
                              `Play again: ${PREFIX}ttt start`
                    });
                }
                
                nextMessage = `🦊 *AI moved to position ${aiMove}*\n\n` +
                             `*YOUR TURN!*\n` +
                             `Make your move by typing:\n` +
                             `\`${PREFIX}ttt move [1-9]\`\n` +
                             `*OR simply type a number 1-9*`;
                
            } else {
                // PvP - switch to other player
                const nextPlayerId = game.currentPlayer === game.player1.id ? 
                    game.player2.id : game.player1.id;
                const nextPlayerName = nextPlayerId === game.player1.id ? 
                    game.player1.name : game.player2.name;
                
                game.currentPlayer = nextPlayerId;
                nextMessage = `*${nextPlayerName}'s turn!*\n` +
                             `Make your move by typing:\n` +
                             `\`${PREFIX}ttt move [1-9]\`\n` +
                             `*OR simply type a number 1-9*`;
            }
            
            return sock.sendMessage(jid, {
                text: `✅ *Move accepted!*\n\n` +
                      `${boardText}\n\n` +
                      `${nextMessage}\n\n` +
                      `Available positions: ${game.getAvailablePositions()}`
            }, { quoted: m });
        }
        
        // ===== UNKNOWN COMMAND =====
        return sock.sendMessage(jid, {
            text: `❌ Unknown command!\n\n` +
                  `Available commands:\n` +
                  `• ${PREFIX}ttt start - Start game\n` +
                  `• ${PREFIX}ttt vs @friend - Challenge friend\n` +
                  `• ${PREFIX}ttt move [1-9] - Make move\n` +
                  `• ${PREFIX}ttt board - Show board\n` +
                  `• ${PREFIX}ttt quit - End game\n` +
                  `• ${PREFIX}ttt help - Full help\n\n` +
                  `Aliases: ${PREFIX}foxytt, ${PREFIX}foxymove`
        }, { quoted: m });
    }
};
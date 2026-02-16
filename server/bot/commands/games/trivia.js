const TRIVIA_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    answer: 2
  },
  {
    question: "How many planets are in our solar system?",
    options: ["7", "8", "9", "10"],
    answer: 1
  },
  {
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    answer: 1
  },
  {
    question: "What year did WhatsApp launch?",
    options: ["2008", "2009", "2010", "2011"],
    answer: 1
  },
  {
    question: "Which element has the chemical symbol 'Au'?",
    options: ["Silver", "Gold", "Iron", "Copper"],
    answer: 1
  }
];

export default {
  name: "trivia",
  alias: ["quiz", "question"],
  description: "Answer trivia questions",
  category: "games",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    
    const question = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    const optionsText = question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
    
    const triviaMsg = `🧠 *TRIVIA QUESTION*\n\n` +
                     `📝 ${question.question}\n\n` +
                     `${optionsText}\n\n` +
                     `💡 Reply with the number (1-4) or letter (A-D)`;
    
    await sock.sendMessage(jid, {
      text: triviaMsg
    }, { quoted: m });
    
    // Store the correct answer for checking (simplified)
    // In a real bot, you'd use a game state manager
    
    return;
  }
};
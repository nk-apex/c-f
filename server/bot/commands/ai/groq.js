import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'groq',
  name: 'groq',
  aliases: ['groqai', 'llmgroq', 'groqfast'],
  icon: '⚡',
  label: 'Groq',
  desc: 'Groq — ultra-fast LLM inference engine'
});

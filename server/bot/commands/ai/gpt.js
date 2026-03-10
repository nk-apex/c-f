import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'gpt',
  name: 'gpt',
  aliases: ['chatgpt', 'askgpt', 'wolfgpt', 'gpt5', 'ai5', 'wolfai'],
  icon: '🤖',
  label: 'GPT',
  desc: 'GPT AI assistant — fast and versatile conversations'
});

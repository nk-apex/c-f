import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'gpt4',
  name: 'gpt4',
  aliases: ['chatgpt4', 'gpt4ai', 'openai4'],
  icon: '🔮',
  label: 'GPT-4',
  desc: 'GPT-4 advanced AI model by OpenAI'
});

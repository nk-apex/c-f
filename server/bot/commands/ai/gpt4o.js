import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'gpt4o',
  name: 'gpt4o',
  aliases: ['chatgpt4o', 'gpt4oai', 'openai4o'],
  icon: '🤯',
  label: 'GPT-4o',
  desc: 'GPT-4o omni AI model by OpenAI'
});

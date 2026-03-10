import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'tinyllama',
  name: 'tinyllama',
  aliases: ['tinyai', 'tinyllm', 'tinylm'],
  icon: '🐑',
  label: 'TinyLlama',
  desc: 'TinyLlama — compact 1.1B parameter AI model'
});

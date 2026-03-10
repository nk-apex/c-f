import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'zephyr',
  name: 'zephyr',
  aliases: ['zephyrai', 'zephyrlm', 'hfzephyr'],
  icon: '🌬️',
  label: 'Zephyr',
  desc: 'Zephyr — HuggingFace aligned language model'
});

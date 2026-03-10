import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'dolphin',
  name: 'dolphin',
  aliases: ['dolphinai', 'dolphinlm', 'dolphin2'],
  icon: '🐬',
  label: 'Dolphin',
  desc: 'Dolphin — uncensored fine-tuned AI model'
});

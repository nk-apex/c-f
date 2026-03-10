import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'nous',
  name: 'nous',
  aliases: ['noushermes', 'nousai', 'hermes'],
  icon: '🧠',
  label: 'Nous Hermes',
  desc: 'Nous Hermes — advanced instruction-tuned AI model'
});

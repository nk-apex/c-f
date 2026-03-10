import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'openhermes',
  name: 'openhermes',
  aliases: ['hermesai', 'ohermes', 'hermes2'],
  icon: '🔓',
  label: 'OpenHermes',
  desc: 'OpenHermes — open-source Hermes AI model'
});

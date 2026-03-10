import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'orca',
  name: 'orca',
  aliases: ['orcaai', 'orcalm', 'orca2'],
  icon: '🐋',
  label: 'Orca',
  desc: 'Orca — Microsoft reasoning-focused AI model'
});

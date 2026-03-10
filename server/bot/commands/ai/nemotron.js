import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'nemotron',
  name: 'nemotron',
  aliases: ['nemotronai', 'nvidiaai', 'nemo'],
  icon: '🚀',
  label: 'Nemotron',
  desc: 'NVIDIA Nemotron — high-accuracy reasoning AI'
});

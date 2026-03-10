import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'falcon',
  name: 'falcon',
  aliases: ['falconai', 'falconlm', 'tiifalcon'],
  icon: '🦅',
  label: 'Falcon',
  desc: 'Falcon AI — high-performance open-source LLM by TII'
});

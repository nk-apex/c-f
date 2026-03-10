import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'claude',
  name: 'claude',
  aliases: ['anthropic', 'claudex'],
  icon: '🎭',
  label: 'Claude',
  desc: 'Claude AI by Anthropic — thoughtful and nuanced responses'
});

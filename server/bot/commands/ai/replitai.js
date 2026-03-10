import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'replit',
  name: 'replitai',
  aliases: ['replitchat', 'replitx', 'replitcode'],
  icon: '🔄',
  label: 'Replit AI',
  desc: 'Replit AI — code-focused AI assistant'
});

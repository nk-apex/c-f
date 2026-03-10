import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'command',
  name: 'commandr',
  aliases: ['commandai', 'coherecommand', 'commandplus'],
  icon: '📜',
  label: 'Command R',
  desc: 'Cohere Command R — enterprise-grade AI model'
});

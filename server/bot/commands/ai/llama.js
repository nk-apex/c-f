import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'llama',
  name: 'llama',
  aliases: ['llamaai', 'metallama', 'llama3', 'metaai2'],
  icon: '🦙',
  label: 'Llama',
  desc: 'Meta Llama AI — open source large language model'
});

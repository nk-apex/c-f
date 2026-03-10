import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'mixtral',
  name: 'mixtral',
  aliases: ['mixai', 'mixtralai', 'moe'],
  icon: '🔀',
  label: 'Mixtral',
  desc: 'Mixtral — mixture-of-experts AI model by Mistral AI'
});

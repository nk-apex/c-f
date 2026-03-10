import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'yi',
  name: 'yi',
  aliases: ['yiai', 'yi34b', 'yi01ai'],
  icon: '🔮',
  label: 'Yi',
  desc: 'Yi — 01.AI bilingual language model'
});

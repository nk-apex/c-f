import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'vicuna',
  name: 'vicuna',
  aliases: ['vicunaai', 'vicunalm', 'vicuna13b'],
  icon: '🦙',
  label: 'Vicuna',
  desc: 'Vicuna — fine-tuned Llama chatbot AI'
});

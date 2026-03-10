import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'neural',
  name: 'neural',
  aliases: ['neuralai', 'neuralchat', 'intelai'],
  icon: '🧬',
  label: 'NeuralChat',
  desc: 'Intel NeuralChat — optimized conversational AI'
});

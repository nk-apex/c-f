import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'phi',
  name: 'phi',
  aliases: ['phiai', 'phi3', 'msai', 'phi4'],
  icon: '🔬',
  label: 'Phi',
  desc: 'Microsoft Phi — small but powerful language model'
});

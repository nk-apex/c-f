import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'starcoder',
  name: 'starcoder',
  aliases: ['starcode', 'starcoderx', 'hfcoder'],
  icon: '⭐',
  label: 'StarCoder',
  desc: 'StarCoder — HuggingFace coding AI model'
});

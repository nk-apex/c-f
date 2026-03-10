import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'internlm',
  name: 'internlm',
  aliases: ['internai', 'internchat', 'shanghaiintern'],
  icon: '🔭',
  label: 'InternLM',
  desc: 'InternLM — Shanghai AI Lab language model'
});

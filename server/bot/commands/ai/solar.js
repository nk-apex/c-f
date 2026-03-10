import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'solar',
  name: 'solar',
  aliases: ['solarai', 'solarlm', 'upstage'],
  icon: '☀️',
  label: 'Solar',
  desc: 'Solar — Upstage high-performance language model'
});

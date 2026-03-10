import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'openchat',
  name: 'openchat',
  aliases: ['openchatai', 'ochat', 'openassist'],
  icon: '💬',
  label: 'OpenChat',
  desc: 'OpenChat — open source chat AI model'
});

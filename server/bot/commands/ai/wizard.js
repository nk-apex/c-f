import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'wizard',
  name: 'wizard',
  aliases: ['wizardlm', 'wizardai', 'wizlm'],
  icon: '🧙',
  label: 'WizardLM',
  desc: 'WizardLM — instruction-following AI model'
});

import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'chatglm',
  name: 'chatglm',
  aliases: ['glmai', 'chatglmai', 'glm4'],
  icon: '🌐',
  label: 'ChatGLM',
  desc: 'ChatGLM — Tsinghua bilingual AI model'
});

import { buildAICommand } from './xwolfAI.js';

export default buildAICommand({
  endpoint: 'codellama',
  name: 'codellama',
  aliases: ['codeai', 'llamacode', 'cllama'],
  icon: '👨‍💻',
  label: 'CodeLlama',
  desc: 'CodeLlama — Meta\'s code-specialized Llama model'
});

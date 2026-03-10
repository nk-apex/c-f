import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: 'aimenu',
  description: 'AI Commands Menu',
  category: 'ai',
  aliases: ['aihelp', 'ai-cmds'],

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;

    const commandsText = `┌─⧭⊷ *🔍 AI SCANNERS & ANALYZERS*
├◆  • aiscanner
├◆  • analyze
├◆  • removebg
├◆  • summarize
├◆  • vision
└─⧭⊷

┌─⧭⊷ *🤖 MAJOR AI MODELS*
├◆  • bard
├◆  • bing
├◆  • blackbox
├◆  • chatgpt
├◆  • claudeai
├◆  • copilot
├◆  • deepseek
├◆  • deepseek+
├◆  • flux
├◆  • gpt
├◆  • grok
├◆  • ilama
├◆  • metai
├◆  • mistral
├◆  • perplexity
├◆  • qwenai
├◆  • venice
├◆  • wormgpt
└─⧭⊷

┌─⧭⊷ *🎨 AI IMAGE GENERATION*
├◆  • brandlogo
├◆  • companylogo
├◆  • logoai
├◆  • suno
└─⧭⊷

┌─⧭⊷ *📝 WRITING & CONTENT*
├◆  • humanizer
├◆  • speechwriter
└─⧭⊷

┌─⧭⊷ *🐺 WOLF AI ASSISTANT*
├◆  • wolf on/off — Toggle Wolf AI
├◆  • wolf status — Show Wolf AI stats
├◆  • wolf clear — Reset conversations
├◆  ───────────────
├◆  When active, just say "wolf"
├◆  followed by anything to chat!
└─⧭⊷`;

    await sendSubMenu(sock, jid, '🤖 AI MENU', commandsText, m, PREFIX);
  }
};

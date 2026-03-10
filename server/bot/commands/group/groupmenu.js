import { sendSubMenu } from '../../lib/menuHelper.js';

export default {
  name: "groupmenu",
  alias: ["gmenu", "grouphelp", "groupcmds"],
  desc: "Shows group management commands",
  category: "Group",
  usage: ".groupmenu",

  async execute(sock, m, args, PREFIX) {
    const jid = m.key.remoteJid;

    const commandsText = `┌─⧭⊷ *🛡️ ADMIN & MODERATION*
├◆  • add
├◆  • promote
├◆  • promoteall
├◆  • demote
├◆  • demoteall
├◆  • kick
├◆  • kickall
├◆  • ban
├◆  • unban
├◆  • ex
├◆  • clearbanlist
├◆  • warn
├◆  • resetwarn
├◆  • setwarn
├◆  • warnings
├◆  • mute
├◆  • unmute
├◆  • gctime
├◆  • antileave
├◆  • antilink
├◆  • addbadword
├◆  • removebadword
├◆  • listbadword
├◆  • welcome
├◆  • goodbye
├◆  • leave
├◆  • creategroup
└─⧭⊷

┌─⧭⊷ *🚫 AUTO-MODERATION*
├◆  • antisticker
├◆  • antiimage
├◆  • antivideo
├◆  • antiaudio
├◆  • antimention
├◆  • antistatusmention
├◆  • antigrouplink
├◆  • antidemote
├◆  • antipromote
├◆  • antiviewonce
├◆  • antibadword
├◆  • antigroupcall
└─⧭⊷

┌─⧭⊷ *📊 GROUP INFO & TOOLS*
├◆  • groupinfo
├◆  • grouplink
├◆  • tagadmin
├◆  • tagall
├◆  • hidetag
├◆  • link
├◆  • invite
├◆  • revoke
├◆  • setdesc
├◆  • fangtrace
├◆  • getgpp
├◆  • togroupstatus
├◆  • getparticipants
├◆  • listonline
├◆  • listinactive
├◆  • approveall
├◆  • rejectall
├◆  • stickerpack
└─⧭⊷`;

    await sendSubMenu(sock, jid, '🏠 GROUP MANAGEMENT', commandsText, m, PREFIX);
  }
};

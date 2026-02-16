export function canUseBot(msg, config) {
  if (!config) return true;
  const sender = (msg.key.participant || msg.key.remoteJid || "").split("@")[0].split(":")[0];
  if (msg.key.fromMe) return true;
  if (config.ownerNumber && sender === config.ownerNumber) return true;
  if (config.mode === "public") return true;
  if (config.mode === "group-only" && msg.key.remoteJid?.endsWith("@g.us")) return true;
  return false;
}

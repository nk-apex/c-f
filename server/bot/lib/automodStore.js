import fs from 'fs';
import path from 'path';

const AUTOMOD_FILE = path.join(process.cwd(), 'server', 'bot', 'data', 'automod.json');

function ensureDir() {
  const dir = path.dirname(AUTOMOD_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadAutomod() {
  try {
    if (fs.existsSync(AUTOMOD_FILE)) return JSON.parse(fs.readFileSync(AUTOMOD_FILE, 'utf-8'));
  } catch {}
  return {};
}

export function saveAutomod(data) {
  ensureDir();
  fs.writeFileSync(AUTOMOD_FILE, JSON.stringify(data, null, 2));
}

export function isEnabled(jid, feature) {
  const data = loadAutomod();
  return !!(data[jid]?.[feature]);
}

export function setEnabled(jid, feature, value) {
  const data = loadAutomod();
  if (!data[jid]) data[jid] = {};
  data[jid][feature] = value;
  saveAutomod(data);
}

export function getGroupSettings(jid) {
  const data = loadAutomod();
  return data[jid] || {};
}

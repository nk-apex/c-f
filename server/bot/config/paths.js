import path from 'path';
import fs from 'fs';
import os from 'os';

const PROJECT_ROOT = process.cwd();

function resolveDataDir() {
    if (process.env.BOT_DATA_DIR) {
        return path.resolve(process.env.BOT_DATA_DIR);
    }
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL) {
        return path.join(PROJECT_ROOT, 'data');
    }
    if (process.env.RENDER) {
        return path.join(PROJECT_ROOT, 'data');
    }
    if (process.env.DYNO) {
        return '/tmp/foxbot_data';
    }
    return path.join(PROJECT_ROOT, 'data');
}

export const DATA_DIR = resolveDataDir();

export const PATHS = {
    data: DATA_DIR,
    session: path.join(DATA_DIR, 'session'),
    db: path.join(DATA_DIR, 'bot.sqlite'),
    dbBackup: path.join(DATA_DIR, 'critical_backup.json'),
    botConfig: path.join(PROJECT_ROOT, 'server', 'bot', 'bot_config.json'),
    botName: path.join(DATA_DIR, 'bot_name.json'),
    buttonMode: path.join(DATA_DIR, 'bot_button_mode.json'),
    chatState: path.join(DATA_DIR, 'chat_state.json'),
    badwords: path.join(DATA_DIR, 'badwords.json'),
    sudoers: path.join(DATA_DIR, 'sudo.json'),
    warnings: path.join(DATA_DIR, 'warnings.json'),
    autoRead: path.join(DATA_DIR, 'autoread_settings.json'),
    tmp: path.join(os.tmpdir(), 'foxbot_tmp'),
};

export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
}

export function ensureDataDirs() {
    ensureDir(DATA_DIR);
    ensureDir(PATHS.tmp);
    ensureDir(path.join(DATA_DIR, 'session'));
    ensureDir(path.join(DATA_DIR, 'chatbot'));
    ensureDir(path.join(DATA_DIR, 'autoread'));
    ensureDir(path.join(DATA_DIR, 'groups'));
    ensureDir(path.join(DATA_DIR, 'games'));
}

ensureDataDirs();

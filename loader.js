import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '.cache', 'core-bundle');

const REPO_URL = "https://github.com/nk-apex/c-f/archive/refs/heads/main.zip";
const EXTRACT_DIR = path.join(TEMP_DIR, "core");
const LOCAL_SETTINGS = path.join(__dirname, "settings.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "settings.js");
const ENV_FILE = path.join(__dirname, ".env");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const loaderColor = '\x1b[36m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

console.log(`\n${loaderColor}╔══════════════════════════════════════════════════════════╗${reset}`);
console.log(`${loaderColor}║     🦊 FOXY LOADER - FOXY BOT v1.0.0                     ║${reset}`);
console.log(`${loaderColor}╚══════════════════════════════════════════════════════════╝${reset}\n`);

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  try {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      const equalsIndex = trimmedLine.indexOf('=');
      if (equalsIndex !== -1) {
        const key = trimmedLine.substring(0, equalsIndex).trim();
        const value = trimmedLine.substring(equalsIndex + 1).trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = cleanValue;
      }
    });
  } catch (e) {
    console.log(`${red}[FOXY] Failed to load .env: ${e.message}${reset}`);
  }
}

async function downloadAndExtract() {
  if (fs.existsSync(EXTRACT_DIR)) {
    console.log(`${green}[FOXY] Core already exists, skipping download.${reset}`);
    return true;
  }

  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const zipPath = path.join(TEMP_DIR, "bundle.zip");

  console.log(`${loaderColor}⚡ Downloading core from remote...${reset}`);

  let response;
  try {
    response = await axios({
      url: REPO_URL,
      method: "GET",
      responseType: "stream",
      timeout: 30000,
      headers: { 'User-Agent': 'axios/downloader' }
    });
  } catch (e) {
    console.log(`${red}[FOXY] Download failed: ${e.message}${reset}`);
    return false;
  }

  try {
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    console.log(`${green}[FOXY] Download complete.${reset}`);
  } catch (e) {
    console.log(`${red}[FOXY] Failed to save zip: ${e.message}${reset}`);
    return false;
  }

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(TEMP_DIR, true);
    console.log(`${green}[FOXY] Extraction complete.${reset}`);
  } catch (e) {
    console.log(`${red}[FOXY] Extraction failed: ${e.message}${reset}`);
    return false;
  } finally {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }

  try {
    const extractedItems = fs.readdirSync(TEMP_DIR);
    console.log(`${loaderColor}[FOXY] Extracted items: ${extractedItems.join(', ')}${reset}`);

    const sourceFolder = extractedItems.find(f =>
      f !== 'core' && fs.statSync(path.join(TEMP_DIR, f)).isDirectory()
    );

    if (sourceFolder) {
      fs.renameSync(path.join(TEMP_DIR, sourceFolder), EXTRACT_DIR);
      console.log(`${green}[FOXY] Renamed "${sourceFolder}" → core${reset}`);
    } else {
      console.log(`${red}[FOXY] No extracted folder found to rename.${reset}`);
      return false;
    }
  } catch (e) {
    console.log(`${red}[FOXY] Folder rename failed: ${e.message}${reset}`);
    return false;
  }

  return true;
}

async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) return;
  try {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log(`${green}[FOXY] Local settings applied.${reset}`);
  } catch (e) {
    console.log(`${red}[FOXY] Failed to apply settings: ${e.message}${reset}`);
  }
  await delay(500);
}

function startBot() {
  let botDir = EXTRACT_DIR;

  if (!fs.existsSync(botDir)) {
    const possibleDirs = [
      path.join(__dirname, 'core'),
      path.join(__dirname, 'bot'),
      path.join(__dirname, 'src')
    ];
    for (const dir of possibleDirs) {
      if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.js'))) {
        botDir = dir;
        break;
      }
    }
  }

  if (!fs.existsSync(botDir)) botDir = __dirname;

  const possibleEntries = ['index.js', 'main.js', 'bot.js', 'app.js'];
  let mainFile = null;

  for (const file of possibleEntries) {
    if (fs.existsSync(path.join(botDir, file))) {
      mainFile = file;
      break;
    }
  }

  if (!mainFile) {
    const contents = fs.existsSync(botDir) ? fs.readdirSync(botDir).join(', ') : 'directory missing';
    console.log(`${red}[FOXY] No entry file found in: ${botDir}${reset}`);
    console.log(`${red}[FOXY] Contents: ${contents}${reset}`);
    setTimeout(() => startBot(), 5000);
    return;
  }

  console.log(`${green}[FOXY] Starting → ${path.join(botDir, mainFile)}${reset}`);

  const bot = spawn("node", [mainFile], {
    cwd: botDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  bot.on("close", (code) => {
    console.log(`${red}[FOXY] Bot exited (code ${code}). Restarting in 3s...${reset}`);
    // FIX: always restart regardless of exit code (including clean exit code 0)
    setTimeout(() => startBot(), 3000);
  });

  bot.on("error", (err) => {
    console.log(`${red}[FOXY] Bot error: ${err.message}. Restarting in 3s...${reset}`);
    setTimeout(() => startBot(), 3000);
  });
}

(async () => {
  loadEnvFile();
  const success = await downloadAndExtract();
  if (!success) {
    console.log(`${red}[FOXY] Download/extract failed. Attempting to start from existing files...${reset}`);
  }
  await applyLocalSettings();
  startBot();
})();

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

const serverFile = path.join(rootDir, 'server', 'index.js');

let tsxPath;
try {
    tsxPath = require.resolve('tsx/cli', { paths: [rootDir] });
} catch {
    try {
        tsxPath = execSync('which tsx', { encoding: 'utf-8' }).trim();
    } catch {
        const localTsx = path.join(rootDir, 'node_modules', '.bin', 'tsx');
        if (fs.existsSync(localTsx)) {
            tsxPath = localTsx;
        }
    }
}

if (tsxPath) {
    const child = spawn(process.execPath, [tsxPath, serverFile], {
        stdio: 'inherit',
        env: process.env,
        cwd: rootDir
    });
    child.on('exit', (code) => process.exit(code || 0));
} else {
    const child = spawn('npx', ['tsx', serverFile], {
        stdio: 'inherit',
        env: process.env,
        cwd: rootDir,
        shell: true
    });
    child.on('exit', (code) => process.exit(code || 0));
}

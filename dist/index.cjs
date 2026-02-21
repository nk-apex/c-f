const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
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

const child = spawn('npx', ['tsx', path.join(__dirname, '..', 'server', 'index.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..')
});

child.on('exit', (code) => {
    process.exit(code || 0);
});

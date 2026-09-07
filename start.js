const { spawn } = require('child_process');
const path = require('path');

let port = process.env.PORT || 3000;

// If CLI passed -p, check if it's a valid integer (ignore unexpanded ${PORT:-3000})
for (let i = 2; i < process.argv.length; i++) {
  if ((process.argv[i] === '-p' || process.argv[i] === '--port') && process.argv[i + 1]) {
    const val = process.argv[i + 1].trim();
    if (/^\d+$/.test(val)) {
      port = parseInt(val, 10);
    }
  }
}

const host = process.env.HOSTNAME || '0.0.0.0';

console.log(`[Aegis] Starting Next.js server on ${host}:${port}...`);

let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next');
} catch (e) {
  nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
}

const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', host], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: host,
  },
});

child.on('error', (err) => {
  console.error('[Aegis] Failed to start Next.js process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

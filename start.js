const { spawn } = require('child_process');

const port = process.env.PORT || 3000;
console.log(`[Aegis] Starting Next.js on port: ${port}`);

const nextProcess = spawn('npx', ['next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

nextProcess.on('error', (err) => {
  console.error('[Aegis] Failed to start Next.js process:', err);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  process.exit(code || 0);
});

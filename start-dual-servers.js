import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message) {
  console.log(`[dual-server] ${message}`);
}

// Start backend server
const backend = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Start frontend server with a delay
setTimeout(() => {
  log('Starting Vite frontend server...');
  const frontend = spawn('npx', ['vite', '--port', '3000', '--host', '0.0.0.0'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit'
  });

  frontend.on('error', (err) => {
    log(`Frontend error: ${err.message}`);
  });
}, 2000);

backend.on('error', (err) => {
  log(`Backend error: ${err.message}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  log('Shutting down servers...');
  backend.kill();
  process.exit(0);
});
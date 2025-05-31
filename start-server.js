// Simple server startup script to bypass tsx dependency issues
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to start the server using available TypeScript loaders
const serverPath = join(__dirname, 'server', 'index.ts');

console.log('Starting server...');

// Try different methods to run TypeScript
const methods = [
  ['npx', ['tsx', serverPath]],
  ['node', ['--loader', 'ts-node/esm', serverPath]],
  ['node', ['--loader', '@esbuild-kit/esm-loader', serverPath]]
];

let currentMethod = 0;

function tryStartServer() {
  if (currentMethod >= methods.length) {
    console.error('All startup methods failed. Please install tsx or ts-node.');
    process.exit(1);
  }

  const [command, args] = methods[currentMethod];
  console.log(`Trying method ${currentMethod + 1}: ${command} ${args.join(' ')}`);

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  child.on('error', (err) => {
    console.log(`Method ${currentMethod + 1} failed:`, err.message);
    currentMethod++;
    setTimeout(tryStartServer, 1000);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Method ${currentMethod + 1} exited with code ${code}`);
      currentMethod++;
      setTimeout(tryStartServer, 1000);
    }
  });
}

tryStartServer();
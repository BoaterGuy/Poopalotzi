#!/usr/bin/env node

// Direct Node.js startup script to bypass tsx dependency issues
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Poopalotzi server...');

// Use the bundled production server
const serverProcess = spawn('node', ['dist/index-production.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5000'
  },
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
});
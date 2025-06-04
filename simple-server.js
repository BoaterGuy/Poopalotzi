#!/usr/bin/env node

// Simple Node.js server to bypass tsx dependency issues
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Poopalotzi boat management application...');

// Try to use the bundled server first
const bundledServer = join(__dirname, 'dist/index.js');

try {
  const serverProcess = spawn('node', [bundledServer], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000'
    },
    stdio: 'inherit',
    cwd: __dirname
  });

  serverProcess.on('error', (error) => {
    console.error('Server error:', error);
    console.log('Falling back to direct tsx execution...');
    
    // Fallback to tsx with the working server
    const fallbackProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '5000'
      },
      stdio: 'inherit',
      cwd: __dirname
    });

    fallbackProcess.on('error', (fallbackError) => {
      console.error('Fallback server error:', fallbackError);
      process.exit(1);
    });

    process.on('SIGINT', () => fallbackProcess.kill('SIGINT'));
    process.on('SIGTERM', () => fallbackProcess.kill('SIGTERM'));
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    serverProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
  });

} catch (startupError) {
  console.error('Startup error:', startupError);
  process.exit(1);
}
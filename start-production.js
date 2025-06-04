#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Poopalotzi Production Server...');

const serverPath = path.join(__dirname, 'final-server.cjs');

const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  },
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('Production server error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Production server exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down production server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
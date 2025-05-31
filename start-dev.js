#!/usr/bin/env node

// Development script to start the server with Vite integration
// This preserves image upload functionality while restoring frontend styling

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Poopalotzi with frontend styling and image upload support...');

// Set environment variables
process.env.NODE_ENV = 'development';

// Start the development server
const devServer = spawn('npx', ['tsx', 'server/dev-server.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

devServer.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

devServer.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down development server...');
  devServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down development server...');
  devServer.kill('SIGTERM');
});
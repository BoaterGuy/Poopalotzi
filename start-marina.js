#!/usr/bin/env node

// Simple startup script for the marina management system
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Marina Management System...');

// Start the production server
const serverProcess = spawn('node', ['dist/index.cjs'], {
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down marina system...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down marina system...');
  serverProcess.kill('SIGTERM');
});
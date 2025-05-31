#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Poopalotzi with separated frontend and backend servers...');

// Set environment variables
process.env.NODE_ENV = 'development';

// Start the backend server on port 5000
const backendServer = spawn('npx', ['tsx', 'server/backend-only.ts'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd()
});

// Start the Vite frontend server on port 3000
const frontendServer = spawn('npx', ['vite'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: join(process.cwd(), 'client')
});

// Handle backend server output
backendServer.stdout.on('data', (data) => {
  process.stdout.write(`[BACKEND] ${data}`);
});

backendServer.stderr.on('data', (data) => {
  process.stderr.write(`[BACKEND] ${data}`);
});

// Handle frontend server output
frontendServer.stdout.on('data', (data) => {
  process.stdout.write(`[FRONTEND] ${data}`);
});

frontendServer.stderr.on('data', (data) => {
  process.stderr.write(`[FRONTEND] ${data}`);
});

// Handle server errors
backendServer.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});

frontendServer.on('error', (error) => {
  console.error('Failed to start frontend server:', error);
  process.exit(1);
});

// Handle process termination
function cleanup() {
  console.log('\n⏹️  Shutting down servers...');
  backendServer.kill('SIGINT');
  frontendServer.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Log startup completion after delay
setTimeout(() => {
  console.log('\n✅ Both servers should now be running:');
  console.log('   Frontend (with styling): http://localhost:3000');
  console.log('   Backend API: http://localhost:5000');
  console.log('   Image uploads working on backend');
}, 3000);
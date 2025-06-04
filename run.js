import { spawn } from 'child_process';

console.log('Starting Poopalotzi Marina Management System...');

const server = spawn('node', ['start-server.js'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.kill('SIGTERM');
  process.exit(0);
});
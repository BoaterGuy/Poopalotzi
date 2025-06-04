const { spawn } = require('child_process');
const http = require('http');

console.log('Launching Poopalotzi boat management application...');

// Start the server
const server = spawn('node', ['poopalotzi-server.cjs'], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

// Keep the process alive and handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});
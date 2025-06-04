const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Poopalotzi boat management server...');

// Start the server using the bundled version
const serverPath = path.join(__dirname, 'dist', 'index.js');

const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5000'
  },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
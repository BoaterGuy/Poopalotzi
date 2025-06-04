const { spawn } = require('child_process');

const server = spawn('node', ['run-app.cjs'], {
  stdio: 'inherit',
  detached: false
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGINT', () => {
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});
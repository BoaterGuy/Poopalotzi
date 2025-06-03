// Simple wrapper to start the TypeScript server
import { register } from 'module';
import { pathToFileURL } from 'url';

// Register TypeScript support
register('tsx/esm', pathToFileURL('./'));

// Import and run the main server
import('./index.ts').then(module => {
  console.log('Server started successfully');
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
#!/usr/bin/env node

// Alternative startup script to bypass tsx dependency issues
// This compiles TypeScript on-the-fly using esbuild and runs the server

import { build } from 'esbuild';
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

async function startServer() {
  try {
    console.log('Building server...');
    
    // Build the server using esbuild
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/server.js',
      external: ['pg-native'],
      banner: {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
      }
    });
    
    console.log('Starting server...');
    
    // Start the compiled server
    const serverProcess = spawn('node', ['dist/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
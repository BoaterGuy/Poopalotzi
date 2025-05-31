#!/usr/bin/env node

// Temporary script to update package.json dev command to restore frontend styling
import fs from 'fs';
import path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update the dev script to use hybrid server with Vite integration
packageJson.scripts.dev = "NODE_ENV=development npx tsx server/hybrid-server.ts";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Updated dev script to restore frontend styling with image upload support');
console.log('🔄 Restarting workflow...');
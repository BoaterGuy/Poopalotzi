import fs from 'fs';

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update the dev script to use the clean server
packageJson.scripts.dev = "NODE_ENV=development npx tsx server/clean-index.ts";

// Write back to package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

console.log('Updated dev script to use clean server without vite dependencies');
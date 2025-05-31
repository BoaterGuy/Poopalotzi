import fs from 'fs';

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update the dev script to use npx tsx
packageJson.scripts.dev = "NODE_ENV=development npx tsx server/index.ts";

// Write back to package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

console.log('Updated dev script to use npx tsx');
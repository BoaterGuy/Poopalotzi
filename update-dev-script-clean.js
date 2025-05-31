import fs from 'fs';
import path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Use original server configuration that includes proper Vite setup
packageJson.scripts.dev = "NODE_ENV=development npx tsx server/index.ts";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Restored development server for frontend styling');
console.log('🔄 Ready to restart with proper CSS and layout support');
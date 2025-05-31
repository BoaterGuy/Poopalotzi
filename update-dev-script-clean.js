import fs from 'fs';
import path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Restore original development setup that includes Vite for frontend styling
packageJson.scripts.dev = "NODE_ENV=development npx tsx server/index.ts";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Restored development server for frontend styling');
console.log('🔄 Ready to restart with proper CSS and layout support');
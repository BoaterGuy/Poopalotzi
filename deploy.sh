#!/bin/bash
echo "Building for production deployment..."

# Build the frontend
npx vite build

# Build the server for production using our production entry point
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.js

echo "Build completed successfully!"
echo "You can now deploy the application by clicking the Deploy button in Replit."
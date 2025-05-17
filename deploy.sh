#!/bin/bash
echo "Building for production deployment..."

# Build the frontend
echo "Building frontend..."
npx vite build

# Copy the production server file to dist directory
echo "Preparing server files..."
cp server/production.js dist/index.js

echo "Build completed successfully!"
echo "You can now deploy the application by clicking the Deploy button in Replit."
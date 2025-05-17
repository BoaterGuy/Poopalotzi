#!/bin/bash
echo "Building minimal deployment version..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy minimal deployment files to dist
cp minimal-deploy/index.js dist/
cp minimal-deploy/package.json dist/

# Create public directory
mkdir -p dist/public

# Copy HTML file
cp minimal-deploy/public/index.html dist/public/

echo "Minimal deployment build complete!"
echo "You can now deploy the application by clicking the Deploy button in Replit."
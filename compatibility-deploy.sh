#!/bin/bash
echo "Building compatibility deployment version..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy compatibility files to dist
cp compatibility-deploy/index.js dist/
cp compatibility-deploy/package.json dist/

# Create public directory for static files
mkdir -p dist/public

echo "Compatibility deployment build complete!"
echo "You can now deploy the application by clicking the Deploy button in Replit."
#!/bin/bash

# Wiki AI Desktop App Build Script
# This script builds the React client and packages it for Electron

set -e

echo "🚀 Building Wiki AI Desktop App..."

# Check if we're in the desktop directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the desktop directory"
    exit 1
fi

# Build the React client
echo "📦 Building React client..."
cd ../client
npm run build

# Copy the build to desktop directory
echo "📁 Copying build files..."
cd ../desktop
rm -rf build
cp -r ../client/build .

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. To run in development mode (on macOS): npm run electron-dev"
echo "2. To build for distribution: npm run dist-mac"
echo "3. The built app will be in the 'dist' folder"

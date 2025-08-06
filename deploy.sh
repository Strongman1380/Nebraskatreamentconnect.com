#!/bin/bash

# Deployment script for Nebraska Treatment Connect
# This script helps prepare the static version for deployment

echo "🚀 Preparing Nebraska Treatment Connect for deployment..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p deploy

# Copy static files to deployment directory
echo "📋 Copying files for static deployment..."
cp index-static.html deploy/index.html
cp config-static.js deploy/config.js
cp static-data.js deploy/
cp scripts-static.js deploy/scripts.js
cp styles.css deploy/
cp netlify.toml deploy/
cp vercel.json deploy/

# Copy other necessary files
echo "📄 Copying additional files..."
cp terms.html deploy/ 2>/dev/null || echo "⚠️  terms.html not found, skipping..."
cp privacy.html deploy/ 2>/dev/null || echo "⚠️  privacy.html not found, skipping..."
cp footer-links.html deploy/ 2>/dev/null || echo "⚠️  footer-links.html not found, skipping..."
cp 404.html deploy/ 2>/dev/null || echo "⚠️  404.html not found, skipping..."

# Copy any image files
echo "🖼️  Copying image files..."
cp *.png deploy/ 2>/dev/null || echo "ℹ️  No PNG files found"
cp *.jpg deploy/ 2>/dev/null || echo "ℹ️  No JPG files found"
cp *.jpeg deploy/ 2>/dev/null || echo "ℹ️  No JPEG files found"

echo "✅ Deployment files prepared in 'deploy' directory"
echo ""
echo "🌐 Next steps:"
echo "1. Test locally: cd deploy && python -m http.server 8000"
echo "2. Deploy to your chosen platform:"
echo "   • Netlify: Drag & drop the 'deploy' folder to netlify.com/drop"
echo "   • Vercel: Run 'vercel' in the deploy directory"
echo "   • GitHub Pages: Push the deploy folder contents to your repository"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
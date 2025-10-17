#!/bin/bash

echo "🔨 Building Barber Booking App..."

# Navigate to client directory
cd client || exit 1

echo "📦 Installing client dependencies..."
npm install

echo "⚛️  Building React app..."
npm run build

echo "✅ Build complete!"
echo "📁 Static files are in client/dist/"

# Go back to server directory
cd ..

echo "🚀 Ready to start server with: npm start"

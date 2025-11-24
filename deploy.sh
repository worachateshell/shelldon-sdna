#!/bin/bash

# Wedding Game Deployment Script
# This script helps deploy the application to a production server

echo "🚀 Starting deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration."
    exit 1
fi

# Check if credentials.json exists
if [ ! -f credentials.json ]; then
    echo "❌ Error: credentials.json not found!"
    echo "Please add your Google Service Account credentials."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Optional: Run tests (if you add them later)
# npm test

# Start the application
echo "🎉 Starting the application..."
npm start

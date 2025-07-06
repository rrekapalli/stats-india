#!/bin/bash

echo "Stats India - Frontend Runner Script"
echo "==================================="
echo

# Check for Node.js and npm
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and npm first:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  Windows: Download from https://nodejs.org/"
    echo
    echo "After installing Node.js and npm, run this script again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm:"
    echo "  Ubuntu/Debian: sudo apt install npm"
    echo "  macOS: brew install npm"
    echo "  Windows: npm is included with Node.js installation"
    echo
    echo "After installing npm, run this script again."
    exit 1
fi

echo "All required dependencies are installed."
echo

# Navigate to the frontend directory
cd src/main/resources/static/frontend

if [ $? -ne 0 ]; then
    echo "Error: Could not navigate to the frontend directory."
    echo "Make sure you're running this script from the project root directory."
    exit 1
fi

echo "Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully."
    echo "Starting the Angular development server..."
    echo "The frontend will be available at http://localhost:4200"
    echo "Press Ctrl+C to stop the server when you're done."
    echo
    npm start
else
    echo "Failed to install dependencies. Please check the error messages above."
    exit 1
fi
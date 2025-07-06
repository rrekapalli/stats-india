#!/bin/bash

echo "Stats India - Build and Run Script"
echo "=================================="
echo

# Check for Maven
if ! command -v mvn &> /dev/null; then
    echo "Maven is not installed. Please install Maven first:"
    echo "  Ubuntu/Debian: sudo apt install maven"
    echo "  macOS: brew install maven"
    echo "  Windows: Download from https://maven.apache.org/download.cgi"
    echo
    echo "After installing Maven, run this script again."
    exit 1
fi

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

# Build and run the Spring Boot backend
echo "Building and running the Spring Boot backend..."
echo "This will start the backend server on http://localhost:8080"
echo "Press Ctrl+C to stop the server when you're done."
echo
echo "Starting Maven build..."
mvn clean install

if [ $? -eq 0 ]; then
    echo "Maven build successful. Starting Spring Boot application..."
    echo "The backend server will be available at http://localhost:8080"
    echo
    echo "To run the frontend, open a new terminal and run:"
    echo "  cd src/main/resources/static/frontend"
    echo "  npm install"
    echo "  npm start"
    echo
    echo "The frontend will be available at http://localhost:4200"
    echo
    echo "Starting backend server now..."
    mvn spring-boot:run
else
    echo "Maven build failed. Please check the error messages above."
    exit 1
fi
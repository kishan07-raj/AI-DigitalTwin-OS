#!/bin/bash

# AI DigitalTwin OS - Setup Script for Mac/Linux

echo "🚀 Setting up AI-DigitalTwin-OS..."

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✓ Node.js $(node --version) found"
else
    echo "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python
echo "🐍 Checking Python..."
if command -v python3 &> /dev/null; then
    echo "✓ Python found"
else
    echo "✗ Python not found. Please install Python 3.11+"
    exit 1
fi

# Install Frontend Dependencies
echo "📦 Installing Frontend dependencies..."
cd frontend
npm install
cd ..

# Install Backend Dependencies
echo "📦 Installing Backend dependencies..."
cd backend
npm install
cd ..

# Setup Python Environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r ai_engine/requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To run the application:"
echo "  1. Start MongoDB"
echo "  2. Run: cd backend && npm run dev"
echo "  3. Run: cd frontend && npm run dev"
echo "  4. Run AI Engine: cd ai_engine && python main.py"


#!/bin/bash

# Student Support System - Docker Startup Script
# ===============================================

echo "🎓 Student Support System - Docker Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp backend/.env.example .env
    echo "📝 Please edit .env file and add your GEMINI_API_KEY"
    echo ""
    read -p "Press Enter to open .env file in nano editor (or Ctrl+C to exit and edit manually)..."
    nano .env
fi

# Check if GEMINI_API_KEY is set
if grep -q "your-gemini-api-key-here" .env || grep -q "gemini-placeholder" .env; then
    echo "⚠️  WARNING: GEMINI_API_KEY is not configured in .env file"
    echo "   The application will not work without a valid API key."
    echo ""
    read -p "Do you want to edit .env now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    fi
fi

echo ""
echo "🚀 Starting Docker containers..."
echo ""

# Build and start containers
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services are running!"
    echo ""
    echo "📍 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📋 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Failed to start services. Check logs:"
    echo "   docker-compose logs"
    echo ""
fi

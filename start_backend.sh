#!/bin/bash
# =============================================
#  Student Support System — Backend Startup
# =============================================

set -e
cd "$(dirname "$0")/backend"

echo ""
echo "🎓 Student Support System — Backend"
echo "====================================="

# Check .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env and set your OPENAI_API_KEY before continuing!"
    echo ""
    read -p "Press Enter after you've set your API key..."
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install from https://python.org"
    exit 1
fi

# Create virtual env if needed
if [ ! -d "venv" ]; then
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000

#!/bin/bash
# =============================================
#  Student Support System — Frontend Startup
# =============================================

set -e
cd "$(dirname "$0")/frontend"

echo ""
echo "🎓 Student Support System — Frontend"
echo "======================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi

echo "📦 Installing npm packages..."
npm install

echo ""
echo "🚀 Starting React app on http://localhost:3000"
echo ""

npm start

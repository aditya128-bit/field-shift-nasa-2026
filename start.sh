#!/usr/bin/env bash
set -e

echo "==================================================================="
echo "  FIELD SHIFT: NASA Agricultural Decision Intelligence System"
echo "  Ubuntu / Debian Linux Setup & Launcher"
echo "==================================================================="

# 1. Virtual Environment
if [ ! -d ".venv" ]; then
    echo "[1/4] Creating Python virtual environment in .venv..."
    python3 -m venv .venv
fi

echo "[2/4] Activating virtual environment & installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 2. Environment Configuration
if [ ! -f ".env" ]; then
    echo "[3/4] Creating .env from .env.example template..."
    cp .env.example .env
else
    echo "[3/4] .env already exists, keeping current configuration."
fi

# 3. Frontend Build (if not already built)
if [ ! -d "frontend/dist" ]; then
    echo "[4/4] Building frontend assets..."
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "[4/4] Frontend build found in frontend/dist."
fi

echo "==================================================================="
echo "  🚀 Starting FIELD SHIFT Server on http://localhost:8000"
echo "  Press Ctrl+C to stop"
echo "==================================================================="
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

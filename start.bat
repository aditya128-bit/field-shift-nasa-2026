@echo off
echo ===================================================================
echo   FIELD SHIFT: NASA Agricultural Decision Intelligence System
echo   Windows CMD Setup ^& Launcher
echo ===================================================================

:: 1. Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

:: 2. Create virtualenv if missing
if not exist .venv (
    echo [1/4] Creating Python virtual environment in .venv...
    python -m venv .venv
)

:: 3. Activate and install dependencies
echo [2/4] Activating virtual environment ^& installing dependencies...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

:: 4. Copy .env if missing
if not exist .env (
    echo [3/4] Creating .env from .env.example template...
    copy .env.example .env
) else (
    echo [3/4] .env already exists, keeping current configuration.
)

:: 5. Build frontend if missing
if not exist frontend\dist (
    echo [4/4] Building frontend assets...
    cd frontend
    call npm install
    call npm run build
    cd ..
) else (
    echo [4/4] Frontend build found in frontend\dist.
)

echo ===================================================================
echo   Starting FIELD SHIFT Server on http://localhost:8000
echo   Press Ctrl+C to stop
echo ===================================================================
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause

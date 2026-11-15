@echo off
setlocal enabledelayedexpansion

:: 1. Force Working Directory to the location of this script
cd /d "%~dp0"

echo ===================================================================
echo   FIELD SHIFT: NASA Agricultural Decision Intelligence System
echo   Windows CMD Setup ^& Launcher (NASA Space Apps 2026)
echo ===================================================================
echo.

:: 2. Detect Python (Virtualenv, python, or py launcher)
set "PY_CMD="

if exist ".venv\Scripts\python.exe" (
    set "PY_CMD=.venv\Scripts\python.exe"
    echo [OK] Found existing Python virtual environment in .venv
) else (
    where python >nul 2>&1
    if not errorlevel 1 (
        set "PY_CMD=python"
    ) else (
        where py >nul 2>&1
        if not errorlevel 1 (
            set "PY_CMD=py"
        )
    )
)

if "%PY_CMD%"=="" (
    echo.
    echo ===================================================================
    echo   [ERROR] Python was not found in your Windows PATH!
    echo.
    echo   Please download and install Python 3.10+ from:
    echo     https://www.python.org/downloads/
    echo.
    echo   IMPORTANT: When installing, make sure to check the box:
    echo     [X] "Add Python to PATH"
    echo ===================================================================
    echo.
    pause
    exit /b 1
)

:: 3. Create Virtual Environment if missing
if not exist ".venv\Scripts\python.exe" (
    echo [1/4] Creating Python virtual environment in .venv...
    %PY_CMD% -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
)

set "VENV_PY=%~dp0.venv\Scripts\python.exe"

:: 4. Install Dependencies
echo [2/4] Verifying and installing backend dependencies...
"%VENV_PY%" -m pip install --upgrade pip >nul 2>&1
"%VENV_PY%" -m pip install -r backend\requirements.txt

:: 5. Copy Environment Template if .env is missing
if not exist ".env" (
    echo [3/4] Creating .env from dummy template...
    copy /y .env.example .env >nul
) else (
    echo [3/4] Configuration file .env already present.
)

:: 6. Verify Frontend Build
if not exist "frontend\dist\index.html" (
    echo [4/4] Pre-built frontend not found. Checking for Node.js / npm...
    where npm >nul 2>&1
    if not errorlevel 1 (
        echo Building frontend assets via npm...
        pushd frontend
        call npm install
        call npm run build
        popd
    ) else (
        echo [NOTICE] Node.js not detected. The backend will serve the API
        echo          and fallback documentation at http://localhost:8000
    )
) else (
    echo [4/4] Pre-compiled React frontend verified in frontend\dist.
)

echo.
echo ===================================================================
echo   🚀 Starting FIELD SHIFT Server on http://localhost:8000
echo   Launching default browser...
echo   (Press Ctrl+C in this window to stop the server)
echo ===================================================================
echo.

:: Automatically open the browser
start "" "http://localhost:8000"

:: Start Uvicorn
"%VENV_PY%" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
if errorlevel 1 (
    echo.
    echo [ERROR] Server encountered an error.
    pause
)

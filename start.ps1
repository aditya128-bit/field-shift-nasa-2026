# ===================================================================
#   FIELD SHIFT: NASA Agricultural Decision Intelligence System
#   Windows PowerShell Setup & Launcher
# ===================================================================

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FIELD SHIFT: NASA Agricultural Decision Intelligence System" -ForegroundColor Cyan
Write-Host "  Windows PowerShell Setup & Launcher" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# 1. Check Python
try {
    $pyVer = python --version
    Write-Host "[OK] Detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://python.org and check 'Add Python to PATH'."
    exit 1
}

# 2. Create virtual environment
if (!(Test-Path -Path ".venv")) {
    Write-Host "[1/4] Creating Python virtual environment in .venv..." -ForegroundColor Yellow
    python -m venv .venv
}

# 3. Activate and install packages
Write-Host "[2/4] Activating virtual environment & installing dependencies..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

# 4. Copy .env
if (!(Test-Path -Path ".env")) {
    Write-Host "[3/4] Creating .env from .env.example template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
} else {
    Write-Host "[3/4] .env already exists, keeping current configuration." -ForegroundColor Green
}

# 5. Build frontend if missing
if (!(Test-Path -Path "frontend/dist")) {
    Write-Host "[4/4] Building frontend assets..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
} else {
    Write-Host "[4/4] Frontend build found in frontend/dist." -ForegroundColor Green
}

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  🚀 Launching FIELD SHIFT Server on http://localhost:8000" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "===================================================================" -ForegroundColor Cyan
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

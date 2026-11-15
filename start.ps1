# ===================================================================
#   FIELD SHIFT: NASA Agricultural Decision Intelligence System
#   Windows PowerShell Setup & Launcher (NASA Space Apps 2026)
# ===================================================================

# 1. Force location to this script's folder
Set-Location $PSScriptRoot

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FIELD SHIFT: NASA Agricultural Decision Intelligence System" -ForegroundColor Cyan
Write-Host "  Windows PowerShell Setup & Launcher" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# 2. Check Python
$pyCmd = $null
if (Test-Path -Path ".venv\Scripts\python.exe") {
    $pyCmd = ".venv\Scripts\python.exe"
    Write-Host "[OK] Using existing Python virtual environment in .venv" -ForegroundColor Green
} else {
    try {
        $testPy = python --version 2>&1
        $pyCmd = "python"
        Write-Host "[OK] Detected: $testPy" -ForegroundColor Green
    } catch {
        try {
            $testPy = py --version 2>&1
            $pyCmd = "py"
            Write-Host "[OK] Detected: $testPy" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Python is not installed or not in your PATH!" -ForegroundColor Red
            Write-Host "Please install Python 3.10+ from https://python.org and check 'Add Python to PATH'."
            exit 1
        }
    }
}

# 3. Create virtual environment if missing
if (!(Test-Path -Path ".venv\Scripts\python.exe")) {
    Write-Host "[1/4] Creating Python virtual environment in .venv..." -ForegroundColor Yellow
    & $pyCmd -m venv .venv
}

$venvPy = "$PSScriptRoot\.venv\Scripts\python.exe"

# 4. Install dependencies
Write-Host "[2/4] Verifying and installing required packages..." -ForegroundColor Yellow
& $venvPy -m pip install --upgrade pip | Out-Null
& $venvPy -m pip install -r backend/requirements.txt

# 5. Copy environment template if missing
if (!(Test-Path -Path ".env")) {
    Write-Host "[3/4] Creating .env from dummy template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
} else {
    Write-Host "[3/4] Configuration file .env already present." -ForegroundColor Green
}

# 6. Verify Frontend Build
if (!(Test-Path -Path "frontend\dist\index.html")) {
    Write-Host "[4/4] Pre-built frontend not found. Checking for npm..." -ForegroundColor Yellow
    try {
        Push-Location frontend
        npm install
        npm run build
        Pop-Location
    } catch {
        Write-Host "[NOTICE] Node.js / npm not detected. Backend will serve API and fallback documentation." -ForegroundColor Gray
        Pop-Location
    }
} else {
    Write-Host "[4/4] Pre-compiled React frontend verified in frontend\dist." -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  🚀 Launching FIELD SHIFT Server on http://localhost:8000" -ForegroundColor Green
Write-Host "  Launching default web browser..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Process "http://localhost:8000"

# Start uvicorn
& $venvPy -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

@echo off
setlocal enabledelayedexpansion
title Aegis-Compliance - Startup Launcher
color 0A

echo ===============================================================================
echo       Aegis-Compliance: Autonomous Regulatory Intelligence System
echo               Ministry of Coal ^& DGMS Statutory Compliance
echo ===============================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [*] Root Directory: %ROOT_DIR%
echo.

:: -----------------------------------------------------------------------------
:: 1. Verify Prerequisites (Node.js & Python)
:: -----------------------------------------------------------------------------
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js [v18+] from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please install Python [v3.10+] from https://python.org/
    pause
    exit /b 1
)

echo [OK] Node.js and Python detected.
echo.

:: -----------------------------------------------------------------------------
:: 2. Setup / Verify Backend Virtual Environment & Dependencies
:: -----------------------------------------------------------------------------
echo [*] Checking Backend Virtual Environment...
if not exist "%ROOT_DIR%backend\.venv\Scripts\activate.bat" (
    echo [!] Virtual environment not found. Creating backend\.venv...
    cd /d "%ROOT_DIR%backend"
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [*] Installing backend dependencies...
    pip install -r requirements.txt
    cd /d "%ROOT_DIR%"
) else (
    echo [OK] Python virtual environment ready.
)

:: -----------------------------------------------------------------------------
:: 3. Verify SQLite Database
:: -----------------------------------------------------------------------------
if not exist "%ROOT_DIR%backend\aegis_compliance.db" (
    echo [!] Database not found. Seeding 30 Indian mines and 80+ regulatory clauses...
    cd /d "%ROOT_DIR%backend"
    call .venv\Scripts\activate.bat
    python -m app.seed
    cd /d "%ROOT_DIR%"
    echo [OK] Database seeded successfully.
) else (
    echo [OK] Database aegis_compliance.db verified.
)

:: -----------------------------------------------------------------------------
:: 4. Verify Frontend Dependencies
:: -----------------------------------------------------------------------------
echo [*] Checking Frontend Dependencies...
if not exist "%ROOT_DIR%node_modules" (
    echo [!] node_modules not found. Running npm install...
    call npm install
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend dependencies ready.
)
echo.

:: -----------------------------------------------------------------------------
:: 5. Launch FastAPI Backend
:: -----------------------------------------------------------------------------
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000...
start "Aegis Backend (FastAPI :8000)" "%ROOT_DIR%backend\run_backend.bat"

:: Wait 3 seconds for backend initialization
ping 127.0.0.1 -n 4 >nul

:: -----------------------------------------------------------------------------
:: 6. Launch Next.js Frontend
:: -----------------------------------------------------------------------------
echo [*] Starting Next.js Frontend on http://localhost:3000...
start "Aegis Frontend (Next.js :3000)" "%ROOT_DIR%run_frontend.bat"

:: Wait 4 seconds for frontend dev server
ping 127.0.0.1 -n 5 >nul

:: -----------------------------------------------------------------------------
:: 7. Launch Web Browser
:: -----------------------------------------------------------------------------
echo [*] Launching Aegis National Portal in your browser...
start http://localhost:3000

echo.
echo ===============================================================================
echo                          ALL SERVICES STARTED!
echo ===============================================================================
echo  Frontend URL:     http://localhost:3000
echo  Backend API Docs: http://127.0.0.1:8000/docs
echo.
echo  STAKEHOLDER DEMO CREDENTIALS:
echo  -------------------------------------------------------------------------
echo  1. DGMS Regulator:       REG-001   /  pass123   (National Command)
echo  2. Mine Safety Manager:  MINE-001  /  pass123   (Colliery Operations)
echo  3. Frontline Inspector:  FIELD-001 /  pass123   (Field Safety & Sirdar)
echo  4. System Administrator: ADMIN-001 /  admin123  (Platform Telemetry)
echo  -------------------------------------------------------------------------
echo.
echo  Keep the two opened command windows running.
echo  To shut down the platform, simply close both opened command windows.
echo ===============================================================================
echo.
pause

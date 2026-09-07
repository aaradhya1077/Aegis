@echo off
title Aegis Backend (FastAPI :8000)
color 0B
cd /d "%~dp0"
echo ===============================================================================
echo                Aegis Backend Service (FastAPI)
echo ===============================================================================
echo [*] Working Directory: %CD%
echo [*] Activating Python Virtual Environment...
call .venv\Scripts\activate.bat
echo [*] Starting Uvicorn server on http://127.0.0.1:8000...
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo [!] Backend service stopped.
pause

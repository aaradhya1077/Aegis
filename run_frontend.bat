@echo off
title Aegis Frontend (Next.js :3000)
color 0E
cd /d "%~dp0"
echo ===============================================================================
echo                Aegis Frontend Service (Next.js)
echo ===============================================================================
echo [*] Working Directory: %CD%
echo [*] Starting Next.js development server...
call npm run dev
echo.
echo [!] Frontend service stopped.
pause

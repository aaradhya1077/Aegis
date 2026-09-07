@echo off
title Aegis - Push to GitHub
color 0B
cd /d "%~dp0"
echo ===============================================================================
echo                     Aegis - Pushing to GitHub Main
echo ===============================================================================
echo.
echo [*] Pushing commits to https://github.com/aaradhya1077/Aegis.git...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Pushed successfully to GitHub!
    echo Railway will now automatically deploy the updated build.
) else (
    echo [ERROR] Push failed. Please check your GitHub permissions.
)
echo.
pause

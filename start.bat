@echo off
title MeRoarringHD Controller Setup
echo =======================================================
echo              MEROARRINGHD CONTROLLER SETUP
echo =======================================================
echo.

:: Cek apakah Node.js sudah terinstall di sistem
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [INFO] Node.js detected:
node -v
echo.

:: Cek apakah folder node_modules sudah ada, kalau belum install dependencies
if not exist node_modules (
    echo [INFO] Installing required dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed!
        pause
        exit /b
    )
)

echo.
echo [INFO] Starting MeRoarringHD Local Server...
echo The dashboard will open automatically in your browser.
echo.
npm start

pause

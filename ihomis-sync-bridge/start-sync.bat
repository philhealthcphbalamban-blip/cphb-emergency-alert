@echo off
title CPHB iHOMIS Plus Auto-Sync Bridge Daemon
color 0A
echo ======================================================================
echo   CEBU PROVINCIAL HOSPITAL - BALAMBAN (CPHB)
echo   iHOMIS Plus Realtime Cloud Auto-Sync Bridge Daemon
echo ======================================================================
echo.
echo Starting Auto-Sync Bridge Service...
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (https://nodejs.org) to run the sync bridge.
    pause
    exit /b
)

if not exist node_modules (
    echo Installing required dependencies (xlsx, node-fetch)...
    npm install xlsx node-fetch
)

echo.
echo [OK] Launching daemon...
node sync-bridge.js
pause

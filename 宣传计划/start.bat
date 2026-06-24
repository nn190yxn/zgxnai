@echo off
title niuniu-marketing-console
setlocal enabledelayedexpansion

echo.
echo   ======================================
echo     Niuniu 30-Day Marketing Console
echo   ======================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Install: https://nodejs.org
    pause
    exit /b 1
)

cd /d "%~dp0"
set "BACKEND_DIR=%~dp0..\backend"

if not exist "%BACKEND_DIR%\.env" (
    echo [ERROR] Missing backend\.env
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Installing npm packages...
    cd /d "%BACKEND_DIR%"
    call npm install --registry=https://registry.npmmirror.com
    cd /d "%~dp0"
)

echo [INFO] Killing old backend on port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [INFO] Starting backend...
set "NODE_PATH=%BACKEND_DIR%\node_modules"
start /B "niuniu-backend" node "%BACKEND_DIR%\src\mysql-production\server.js"

echo [INFO] Waiting for backend to start (10s)...
timeout /t 10 /nobreak >nul

echo [INFO] Opening browser...
start "" "http://127.0.0.1:3002/marketing/"

echo.
echo   Browser should open now.
echo   If page doesn't load, wait a few seconds and refresh.
echo   Close this window to stop backend.
echo   ======================================
pause >nul

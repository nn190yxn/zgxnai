@echo off
title niuniu-marketing-console
setlocal enabledelayedexpansion

echo.
echo   ======================================
echo     Niuniu 30-Day Marketing Console
echo   ======================================
echo.

echo [STEP 1] Checking Node.js...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    pause
    exit /b 1
)
echo          Node.js OK.

set "SCRIPT_DIR=%~dp0"
echo [STEP 2] Script dir: %SCRIPT_DIR%

cd /d "%SCRIPT_DIR%"
set "BACKEND_DIR=%SCRIPT_DIR%..\backend"
echo [STEP 3] Backend dir: %BACKEND_DIR%

if not exist "%BACKEND_DIR%\.env" (
    echo [ERROR] .env not found at %BACKEND_DIR%\.env
    pause
    exit /b 1
)
echo [STEP 4] .env OK.

if not exist "%BACKEND_DIR%\node_modules\express" (
    echo [STEP 5] Installing npm packages (first run)...
    cd /d "%BACKEND_DIR%"
    call npm install --registry=https://registry.npmmirror.com
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    cd /d "%SCRIPT_DIR%"
    echo          npm install done.
) else (
    echo [STEP 5] node_modules OK.
)

echo [STEP 6] Killing old backend on port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo          Port 3002 clear.

echo [STEP 7] Starting backend...
set "NODE_PATH=%BACKEND_DIR%\node_modules"
start /B "niuniu-backend" node "%BACKEND_DIR%\src\mysql-production\server.js"
if %errorlevel% neq 0 (
    echo [ERROR] Backend start failed.
    pause
    exit /b 1
)

echo [STEP 8] Waiting for backend (10s)...
timeout /t 10 /nobreak >nul

echo [STEP 9] Opening browser...
start "" "http://127.0.0.1:3002/marketing/"

echo.
echo   === READY ===
echo   Browser should open at http://127.0.0.1:3002/marketing/
echo   If page blank, wait and refresh.
echo   Close this window to stop backend.
echo.
pause

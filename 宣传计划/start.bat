@echo off
chcp 65001 >nul
title 小牛育儿 30天宣传指挥台
setlocal enabledelayedexpansion

:: ==================================
::  小牛育儿 30天宣传指挥台 启动脚本
::  用法: 双击此文件
:: ==================================

echo.
echo   ╔══════════════════════════════════╗
echo   ║   小牛育儿 30天宣传指挥台       ║
echo   ║   看懂孩子短板，带娃更省心       ║
echo   ╚══════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org
    pause
    exit /b 1
)

:: Navigate to script directory
cd /d "%~dp0"

:: Backend directory (relative to this script)
set "BACKEND_DIR=%~dp0..\backend"

:: Check .env
if not exist "%BACKEND_DIR%\.env" (
    echo [错误] 未找到 %BACKEND_DIR%\.env
    echo 请先配置 .env 文件 ^(必需项: AI_PROVIDER, AI_API_KEY, AI_MODEL^)
    pause
    exit /b 1
)

:: Check npm dependencies
if not exist "%BACKEND_DIR%\node_modules" (
    echo [提示] 首次启动，正在安装依赖...
    cd /d "%BACKEND_DIR%"
    call npm install
    cd /d "%~dp0"
)

:: Kill existing process on port 3002
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING" 2^>nul') do (
    echo [提示] 端口 3002 已被占用，正在关闭旧进程 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo [启动] 后端服务 (端口 3002)...
set "NODE_PATH=%BACKEND_DIR%\node_modules;%NODE_PATH%"
start /B "niuniu-backend" node "%BACKEND_DIR%\src\mysql-production\server.js"

:: Wait for backend to be ready
echo [等待] 后端就绪...
set /a count=0
:wait_loop
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:3002/health >nul 2>&1
if %errorlevel% equ 0 goto backend_ready
set /a count+=1
if %count% lss 30 goto wait_loop

echo [错误] 后端启动失败，请检查 .env 配置
pause
exit /b 1

:backend_ready
echo [就绪] 后端服务已启动
echo.
echo   指挥台: http://127.0.0.1:3002/marketing/
echo.
echo   正在打开浏览器...

:: Open browser
start "" "http://127.0.0.1:3002/marketing"

echo.
echo   按此窗口的关闭按钮或 Ctrl+C 停止服务
echo   ══════════════════════════════════
echo.

:: Keep window open
pause >nul

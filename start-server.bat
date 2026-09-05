@echo off
title Homestay Development Server
cd /d "%~dp0"
set "PATH=C:\Users\laksh\node-clean\node-v20.11.1-win-x64;%PATH%"
echo ========================================================
echo   Homestay Portal - http://localhost:3000
echo ========================================================
echo.

if not exist "node_modules\" (
    echo [INFO] node_modules missing. Running npm install first...
    call npm install
    echo.
)

echo Starting Next.js Dev Server...
echo.
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [NOTICE] Dev server stopped or failed.
    echo ========================================================
    pause
)

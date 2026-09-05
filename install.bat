@echo off
title Install Homestay Dependencies
cd /d "%~dp0"
echo ========================================================
echo   Installing Homestay Dependencies (npm install)...
echo ========================================================
echo.
call npm install
echo.
echo ========================================================
if %errorlevel% equ 0 (
    echo [SUCCESS] Dependencies installed successfully!
    echo You can now double-click start-server.bat to start.
) else (
    echo [ERROR] npm install encountered an error.
)
echo ========================================================
echo.
pause

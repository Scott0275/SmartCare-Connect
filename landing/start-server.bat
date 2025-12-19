@echo off
REM SmartCare Landing Page - Quick Start Script
REM This script helps you get the landing page running locally

echo.
echo ================================================
echo   SmartCare Landing Page - Quick Start
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/3] Python found! Starting local server...
    echo.
    echo Starting server on: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    cd /d "%~dp0"
    python -m http.server 8000
) else (
    echo [1/3] Python not found. Trying Node.js...
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [2/3] Node.js found! Installing http-server...
        call npm install -g http-server >nul 2>&1
        echo [3/3] Starting local server...
        echo.
        echo Starting server on: http://localhost:8000
        echo Press Ctrl+C to stop the server
        echo.
        cd /d "%~dp0"
        call npx http-server . -p 8000
    ) else (
        echo.
        echo ERROR: Neither Python nor Node.js found!
        echo.
        echo Please install one of the following:
        echo   1. Python: https://www.python.org/downloads/
        echo   2. Node.js: https://nodejs.org/
        echo.
        echo After installation, run this script again.
        echo.
        echo Alternatively, you can open the landing page directly:
        echo   File → Open → c:\Projects\SmartCare-Connect\landing\index.html
        echo.
        pause
        exit /b 1
    )
)

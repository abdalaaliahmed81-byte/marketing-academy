@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 22.12 or newer and run this file again.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4173/"
node scripts\serve.mjs
pause

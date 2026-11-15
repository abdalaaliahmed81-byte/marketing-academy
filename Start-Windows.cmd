@echo off
setlocal
if exist "%~dp0Marketing-Academy-2.0.0-win-x64.exe" (
  start "" "%~dp0Marketing-Academy-2.0.0-win-x64.exe"
  exit /b
)
if exist "%~dp0release\Marketing-Academy-2.0.0-win-x64.exe" (
  start "" "%~dp0release\Marketing-Academy-2.0.0-win-x64.exe"
  exit /b
)
start "" "https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/latest"

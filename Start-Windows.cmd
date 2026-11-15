@echo off
setlocal
for %%D in ("%~dp0" "%~dp0release\") do (
  for /f "delims=" %%F in ('dir /b /a-d /o-d "%%~DMarketing-Academy-*-win-x64.exe" 2^>nul') do (
    start "" "%%~D%%F"
    exit /b
  )
)
start "" "https://github.com/abdalaaliahmed81-byte/marketing-academy/releases/latest"

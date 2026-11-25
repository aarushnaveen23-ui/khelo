@echo off
setlocal
cd /d "%~dp0"
title KHELO - Install Dependencies
echo.
echo  KHELO DEPENDENCY INSTALLER
echo  -------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is missing from PATH.
  echo Install Node.js 24 or newer, reopen this window, and run this file again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
for /f %%v in ('node -p "Number(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 24 (
  echo ERROR: KHELO needs Node.js 24 or newer.
  node --version
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
echo Node version:
node --version
echo.
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env. Use SETUP_EMAIL_LOGIN.bat to configure email login.
)
echo Installing app packages. This needs internet access...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Dependencies installed successfully.
echo Next: run SETUP_EMAIL_LOGIN.bat once, then RUN_KHELO.bat or BUILD_KHELO_EXE.bat.
pause

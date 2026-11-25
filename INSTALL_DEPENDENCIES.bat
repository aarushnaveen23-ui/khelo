@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title KHELO - Install Dependencies

echo.
echo  KHELO DEPENDENCY INSTALLER
echo  -------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is missing from PATH.
  echo Install Node.js 24 or newer, reopen this window, and run this file again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

set "NODE_MAJOR="
for /f %%v in ('node -p "Number(process.versions.node.split('.')[0])"') do set "NODE_MAJOR=%%v"
if not defined NODE_MAJOR (
  echo ERROR: Could not read the Node.js version.
  pause
  exit /b 1
)
if %NODE_MAJOR% LSS 24 (
  echo ERROR: KHELO needs Node.js 24 or newer.
  node --version
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  echo Close this window, reopen Command Prompt, and try again.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: package.json is missing.
  echo Run this file from the extracted KHELO project folder.
  pause
  exit /b 1
)

echo Node version:
node --version
echo npm version:
call npm --version
echo.

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Created .env. Use SETUP_EMAIL_LOGIN.bat to configure email login.
  )
)

echo Step 1 of 2: Checking access to the npm package registry...
call npm ping --fetch-retries=0 --fetch-timeout=20000
if errorlevel 1 (
  echo.
  echo ERROR: This computer could not reach https://registry.npmjs.org/
  echo Check your internet connection, DNS, firewall, VPN, or proxy.
  echo Then run INSTALL_DEPENDENCIES.bat again.
  pause
  exit /b 1
)

echo.
echo Step 2 of 2: Installing KHELO app packages...
echo This first install can take several minutes. Keep this window open.
echo Detailed install messages will appear below.
echo.

call npm install --no-audit --no-fund --progress=false --foreground-scripts --loglevel=info --fetch-retries=4 --fetch-timeout=600000
if errorlevel 1 goto :failed

if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo WARNING: npm finished, but the Electron Windows runtime was not found.
  echo Run BUILD_KHELO_EXE.bat to see whether packaging can complete.
)

echo.
echo Dependencies installed successfully.
echo Next: run SETUP_EMAIL_LOGIN.bat once, then RUN_KHELO.bat or BUILD_KHELO_EXE.bat.
pause
exit /b 0

:failed
echo.
echo ERROR: npm could not finish installing KHELO dependencies.
echo Read the first npm ERR! or network error shown above.
echo ETIMEDOUT, ECONNRESET, EAI_AGAIN, or a GitHub download error usually means
echo the connection was interrupted while npm or Electron was downloading files.
echo Check internet access, then run this installer again.
pause
exit /b 1

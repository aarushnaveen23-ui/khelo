@echo off
setlocal
cd /d "%~dp0"
title KHELO - Install Node.js
echo.
echo  KHELO NODE.JS INSTALLER
echo  -----------------------
where node >nul 2>nul
if not errorlevel 1 (
  for /f %%v in ('node -p "Number(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%v
  if %NODE_MAJOR% GEQ 24 (
    echo Node.js is already installed:
    node --version
    pause
    exit /b 0
  )
  echo An older Node.js version was found:
  node --version
)
where winget >nul 2>nul
if errorlevel 1 (
  echo Windows Package Manager was not found.
  echo Opening the official Node.js download page.
  start "" "https://nodejs.org/en/download"
  echo Install Node.js 24 or newer, then reopen Windows Terminal.
  pause
  exit /b 1
)
echo Installing the current Node.js LTS release using Windows Package Manager...
winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo.
  echo Automatic installation did not complete.
  echo Open the official Node.js download page and install Node.js 24 or newer.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
echo.
echo Node.js installer finished.
echo Close this window and open a NEW Command Prompt before running INSTALL_KHELO.bat again.
pause

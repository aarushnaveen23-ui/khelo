@echo off
setlocal
cd /d "%~dp0"
title KHELO - Run Desktop App
echo.
echo  STARTING KHELO DESKTOP
echo  ----------------------
if not exist "node_modules" (
  echo Dependencies are missing. Running the installer first...
  call "INSTALL_DEPENDENCIES.bat"
  if errorlevel 1 exit /b 1
)
call npm start
if errorlevel 1 (
  echo.
  echo KHELO did not start. Read the error above and check README.md.
  pause
)

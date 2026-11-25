@echo off
setlocal
cd /d "%~dp0"
title KHELO - First Time Setup
echo.
echo  KHELO - FIRST TIME SETUP
echo  ========================
echo.
call "INSTALL_DEPENDENCIES.bat"
if errorlevel 1 exit /b 1
echo.
echo Opening the email login configuration...
call "SETUP_EMAIL_LOGIN.bat"
echo.
echo Setup step complete. Next run:
echo   RUN_KHELO.bat       - open KHELO desktop app
echo   BUILD_KHELO_EXE.bat - create the Windows installer
pause

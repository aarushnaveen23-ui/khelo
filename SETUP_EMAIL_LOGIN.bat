@echo off
setlocal
cd /d "%~dp0"
title KHELO - Email and Password Setup
echo.
echo  KHELO EMAIL + PASSWORD SETUP
echo  ----------------------------
if not exist ".env" (
  if not exist ".env.example" (
    echo ERROR: .env.example is missing.
    pause
    exit /b 1
  )
  copy ".env.example" ".env" >nul
  echo Created .env from .env.example.
)
echo.
echo The next step opens the local configuration file.
echo Paste your Supabase Project URL and PUBLIC anon/publishable key.
echo Never paste a service_role or secret key here.
echo.
start "" notepad.exe ".env"
echo.
echo Read SUPABASE_SETUP.md for the one-time email/password provider setup.
echo Save .env, close Notepad, then run BUILD_KHELO_EXE.bat.
pause

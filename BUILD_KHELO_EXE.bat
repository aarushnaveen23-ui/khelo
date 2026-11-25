@echo off
setlocal
cd /d "%~dp0"
title KHELO - Build Windows EXE
echo.
echo  KHELO WINDOWS INSTALLER BUILDER
echo  --------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 24 or newer is required.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
for /f %%v in ('node -p "Number(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 24 (
  echo ERROR: Please install Node.js 24 or newer.
  node --version
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo.
  echo A new .env file was created. Configure email login before packaging.
  start "" notepad.exe ".env"
  echo Save and close .env, then run BUILD_KHELO_EXE.bat again.
  pause
  exit /b 1
)
findstr /C:"VITE_SUPABASE_URL=https://" ".env" >nul
if errorlevel 1 (
  echo ERROR: VITE_SUPABASE_URL is not configured in .env.
  start "" notepad.exe ".env"
  pause
  exit /b 1
)
findstr /C:"VITE_SUPABASE_ANON_KEY=" ".env" >nul
if errorlevel 1 (
  echo ERROR: VITE_SUPABASE_ANON_KEY is missing from .env.
  start "" notepad.exe ".env"
  pause
  exit /b 1
)
findstr /C:"YOUR_PROJECT_REF" ".env" >nul
if not errorlevel 1 (
  echo ERROR: Replace the example Supabase project URL in .env.
  start "" notepad.exe ".env"
  pause
  exit /b 1
)
findstr /C:"YOUR_SUPABASE" ".env" >nul
if not errorlevel 1 (
  echo ERROR: Replace the example key with your real public anon/publishable key.
  start "" notepad.exe ".env"
  pause
  exit /b 1
)
echo Node version:
node --version
echo.
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :failed
)
echo Running KHELO checks...
call npm run verify
if errorlevel 1 goto :failed
echo.
echo Building the Windows installer...
call npm run dist:win
if errorlevel 1 goto :failed
echo.
echo SUCCESS! Your KHELO installer is inside the release folder.
if exist "release" start "" explorer.exe "%CD%\release"
pause
exit /b 0

:failed
echo.
echo BUILD FAILED. Read the error above; nothing has been hidden.
pause
exit /b 1

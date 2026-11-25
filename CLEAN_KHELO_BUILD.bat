@echo off
setlocal
cd /d "%~dp0"
title KHELO - Clean Build Files
echo This removes generated dist and release folders only.
echo It does not delete source files or node_modules.
choice /c YN /m "Continue"
if errorlevel 2 exit /b 0
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
echo Build folders cleaned.
pause

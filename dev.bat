@echo off
title HCTC_REVOLUTION (VITE)
chcp 65001 > nul

echo.
echo  [HCTC Player] Cleaning up previous processes...
echo.

:: Kill any existing node processes to free up port 3000 (standard for this project)
taskkill /F /IM node.exe > nul 2>&1

:: Clean build and cache if necessary (optional)
:: if exist dist rd /s /q dist > nul 2>&1

set NODE_OPTIONS=--max-old-space-size=4096
set WATCHPACK_POLLING=true

echo.
echo  [HCTC Player] Starting Vite development server...
echo.

:: Start Vite dev server through npm script
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Server crashed or stopped unexpectedly!
    echo.
    pause
)

pause


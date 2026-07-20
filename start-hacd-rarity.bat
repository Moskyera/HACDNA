@echo off
setlocal EnableExtensions
title HACDNA
cd /d "%~dp0"

echo.
echo  ============================================
echo   HACDNA  -  HACD Mining Rarity (Mainnet)
echo  ============================================
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm not found. Install Node.js / pnpm first.
  echo         https://nodejs.org  then:  npm install -g pnpm
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/3] Installing dependencies...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] pnpm install failed.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dependencies OK
)

if not exist "data\mainnet-index.json" (
  echo [2/3] Seeding mainnet diamond index ^(first run^)...
  call pnpm seed:mainnet
) else (
  echo [2/3] Mainnet index found
)

echo [3/3] Starting dev server on http://localhost:3000
echo.
echo  Press Ctrl+C to stop the server.
echo  ============================================
echo.

start "" "http://localhost:3000"
call pnpm dev

echo.
echo Server stopped.
pause
endlocal

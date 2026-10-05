@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "APP_HOST=127.0.0.1"
set "APP_PORT=3000"
set "APP_URL=http://%APP_HOST%:%APP_PORT%/?preview=player"
set "VITE_ENTRY=%CD%\node_modules\vite\bin\vite.js"
set "NODE_EXE="

title HRG GAME Local Server

for %%N in (node.exe) do set "NODE_EXE=%%~$PATH:N"

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not defined NODE_EXE (
  echo [ERROR] Node.js was not found.
  echo Install Node.js, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "%VITE_ENTRY%" (
  echo [ERROR] Project dependencies are missing.
  echo Run npm install or pnpm install in this folder first.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
  echo [READY] Server is already running. Opening the player page...
  start "" "%APP_URL%"
  exit /b 0
)

echo [START] HRG GAME local server
echo [URL]   %APP_URL%
echo [INFO]  Keep this window open. Closing it stops the server.
echo.

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "$url = '%APP_URL%'; for ($i = 0; $i -lt 80; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if ($r.StatusCode -ge 200) { Start-Process $url; exit } } catch {}; Start-Sleep -Milliseconds 250 }; Start-Process $url"

"%NODE_EXE%" "%VITE_ENTRY%" --host "%APP_HOST%" --port "%APP_PORT%" --strictPort

echo.
echo [INFO] Server stopped.
pause
endlocal

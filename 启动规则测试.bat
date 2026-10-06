@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title HRG Rule Integration Lab
set "NODE_EXE="
for %%N in (node.exe) do set "NODE_EXE=%%~$PATH:N"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined NODE_EXE (
  echo [ERROR] Install Node.js 24 LTS first.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo [ERROR] Run npm ci in this folder first.
  pause
  exit /b 1
)
echo [INFO] Open the URL printed below. Keep this window open.
echo [KEY] Copy the key from local-private\rules-test-key.txt into the test page.
"%NODE_EXE%" scripts\start-test-lab.mjs
pause

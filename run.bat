@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js LTS nu este instalat. Instaleaza-l de la https://nodejs.org/ apoi ruleaza din nou acest fisier.
  pause
  exit /b 1
)
if not exist node_modules\js-synthesizer\ (
  echo Prima pornire: instalez dependentele necesare...
  call npm install
  if errorlevel 1 (echo Instalarea a esuat.& pause & exit /b 1)
)
start "Studio DAW" http://localhost:5173
call npm run dev
pause

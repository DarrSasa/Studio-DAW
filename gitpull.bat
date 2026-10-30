@echo off
cd /d "%~dp0"
git check-ignore -q "SoundFonts/FluidR3_GM.sf2"
if errorlevel 1 (
  echo ERROR: SoundFont ignore rule missing; refusing to pull until .gitignore is repaired.
  pause
  exit /b 1
)
git pull --rebase origin main
if errorlevel 1 (
  echo Pull failed. Check remote 'origin', branch 'main', and resolve any conflicts shown above.
  pause
  exit /b 1
)
echo Pull completed. Your local SoundFonts folder was not changed by git.
pause

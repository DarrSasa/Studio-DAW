@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
echo Checking that local SoundFont files are ignored...
git check-ignore -q "SoundFonts/FluidR3_GM.sf2"
if errorlevel 1 (
  echo ERROR: SoundFont is not ignored. Stop to avoid pushing a large sample file.
  pause
  exit /b 1
)
git add -A
git diff --cached --quiet
if errorlevel 1 (
  set /p msg=Commit message:
  if not defined msg set msg=Update Studio DAW
  git commit -m "!msg!"
  if errorlevel 1 (pause & exit /b 1)
) else (
  echo No changes to commit.
)
git push -u origin main
if errorlevel 1 (
  echo Push failed. Check that remote 'origin' is configured and credentials are available.
  pause
  exit /b 1
)
echo Push completed.
pause

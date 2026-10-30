@echo off
cd /d "%~dp0"
if not exist .git\ goto initrepo
goto addremote
:initrepo
echo Initializing the unpacked Studio DAW folder as branch main...
git init -b main
if errorlevel 1 (pause & exit /b 1)
set /p gitname=Git author name:
set /p gitemail=Git author email:
if not defined gitname set gitname=Studio DAW User
if not defined gitemail set gitemail=studio-daw@users.noreply.local
git config user.name "%gitname%"
git config user.email "%gitemail%"
git check-ignore -q "SoundFonts/FluidR3_GM.sf2"
if errorlevel 1 (echo SoundFont ignore rule failed.& pause & exit /b 1)
git add -A
git commit -m "Initial Studio DAW project"
if errorlevel 1 (pause & exit /b 1)
:addremote
echo Enter the HTTPS or SSH URL of an EMPTY remote repository you created (GitHub/GitLab/etc.).
set /p remote=Remote URL:
if not defined remote (
  echo No URL entered; nothing changed.
  pause
  exit /b 1
)
git remote remove origin 2>nul
git remote add origin "%remote%"
git push -u origin main
if errorlevel 1 (
  echo Remote set, but first push failed. Check authentication and repository permissions.
  pause
  exit /b 1
)
echo Remote configured and initial push completed.
pause

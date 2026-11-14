@echo off
setlocal
rem Double-click wrapper: install or repair the statusline bundle for your DSH profile.
rem Pass -Profile <name>, -DryRun, or other install.ps1 switches after the command.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
set "code=%errorlevel%"
echo.
if not "%code%"=="0" echo Installer exited with code %code%.
if "%~1"=="" pause
exit /b %code%

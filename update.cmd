@echo off
setlocal
rem Double-click wrapper: update the checkout, relink the package, and re-register it.
rem Equivalent one-liner: irm https://raw.githubusercontent.com/devopshelper/DSH-statusline/main/install.ps1 | iex
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Update %*
set "code=%errorlevel%"
echo.
if not "%code%"=="0" echo Updater exited with code %code%.
pause
exit /b %code%

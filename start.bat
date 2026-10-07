@echo off
cd /d "%~dp0"
if "%LAYA_PY%"=="" set "LAYA_PY=%USERPROFILE%\laya\.venv\Scripts\python.exe"
if not exist "%LAYA_PY%" set "LAYA_PY=python"
if "%PORT%"=="" set "PORT=8765"
echo Starting FindMyStack on http://127.0.0.1:%PORT%  (Laya needs about 45 s to load)
start "" "http://127.0.0.1:%PORT%"
"%LAYA_PY%" -m uvicorn app:app --host 127.0.0.1 --port %PORT%

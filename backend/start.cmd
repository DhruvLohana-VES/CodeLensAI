@echo off
REM Start backend: activate venv then run uvicorn
cd /d %~dp0
if not exist venv\Scripts\activate.bat (
  echo backend\venv not found. Create a venv and install requirements.
  exit /b 1
)
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload

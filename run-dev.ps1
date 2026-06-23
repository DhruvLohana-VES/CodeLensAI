# Launch frontend and backend dev servers in separate PowerShell windows
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Start frontend (Next.js)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\frontend'; npm run dev"

# Start backend: use the backend start script which activates its own venv
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; .\start.ps1"

# Start the backend with the backend/venv activated and run uvicorn
param(
    [switch]$NoReload
)

# Ensure script runs from backend folder
Set-Location $PSScriptRoot

if (-Not (Test-Path .\venv\Scripts\Activate.ps1)) {
    Write-Error "backend\venv not found. Please create and install dependencies: python -m pip install -r requirements.txt"
    exit 1
}

# Activate the venv for this PowerShell session
. .\venv\Scripts\Activate.ps1

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-Not $python) {
    Write-Error "Python not found in activated venv. Ensure the venv activation succeeded."
    exit 1
}

if ($NoReload) {
    & $python -m uvicorn app.main:app
} else {
    & $python -m uvicorn app.main:app --reload
}

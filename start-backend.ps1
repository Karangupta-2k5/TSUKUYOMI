# Start the Tsukuyomi Watch FastAPI Backend (Watchtower module API)
Write-Host "Starting Tsukuyomi Watch Backend on http://localhost:8000..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    .\.venv\Scripts\python -m pip install -r requirements.txt
}
.\.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

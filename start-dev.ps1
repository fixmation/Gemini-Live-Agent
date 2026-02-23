# Gemini Live Agent - Development Startup Script
# This script starts both backend and frontend servers

Write-Host "🚀 Starting Gemini Live Agent..." -ForegroundColor Cyan
Write-Host ""

# Check if GOOGLE_API_KEY is set
if (-not $env:GOOGLE_API_KEY) {
    Write-Host "⚠️  WARNING: GOOGLE_API_KEY environment variable is not set!" -ForegroundColor Yellow
    Write-Host "   Please set it with: `$env:GOOGLE_API_KEY = 'your-api-key-here'" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Exiting..." -ForegroundColor Red
        exit 1
    }
}

# Check if backend dependencies are installed
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Cyan
Push-Location backend
if (-not (Test-Path "venv")) {
    Write-Host "   Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "   Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "   Installing/updating requirements..." -ForegroundColor Yellow
pip install -r requirements.txt -q

Pop-Location

# Check if frontend dependencies are installed
Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing npm packages..." -ForegroundColor Yellow
    npm install
}
Pop-Location

Write-Host ""
Write-Host "✅ All dependencies ready!" -ForegroundColor Green
Write-Host ""

# Start backend server in background
Write-Host "🔧 Starting backend server (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python server.py" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend dev server in background
Write-Host "🎨 Starting frontend dev server (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✨ Gemini Live Agent is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Quick Links:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Features Available:" -ForegroundColor Cyan
Write-Host "   1. Story Director - Generate interleaved multimodal stories" -ForegroundColor White
Write-Host "   2. UI Navigator - Navigate UI with batch commands" -ForegroundColor White
Write-Host "   3. 🎙️ Live Mode - Real-time audio/video streaming with Gemini" -ForegroundColor White
Write-Host ""
Write-Host "💡 Testing Live Mode:" -ForegroundColor Cyan
Write-Host "   1. Click the '🎙️ Live' button in the UI" -ForegroundColor White
Write-Host "   2. Choose a panel (Audio, Navigation, or Story)" -ForegroundColor White
Write-Host "   3. Grant microphone/screen permissions when prompted" -ForegroundColor White
Write-Host "   4. Start interacting!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to monitor this script, or close windows to stop servers." -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep -Seconds 10
}

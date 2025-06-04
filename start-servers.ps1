# Script to start both Backend and Frontend servers
Write-Host "🚀 Starting GenCare Application Servers..." -ForegroundColor Green

# Function to start backend
function Start-Backend {
    Write-Host "📦 Starting Backend (port 3000)..." -ForegroundColor Blue
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend (port 5173)..." -ForegroundColor Cyan
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
}

# Start both servers
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host "   🔧 Backend API: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 To test API connection:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:5173/blogs" -ForegroundColor White
Write-Host "   2. Click 'Test API' button" -ForegroundColor White
Write-Host "   3. Check browser console for results" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 
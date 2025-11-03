# Barber Booking - Dev Starter Script
# Ubija postojeće procese i pokreće backend i frontend na pravim portovima

Write-Host "🔪 Ubijam postojeće Node procese..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "🚀 Pokrećem Backend (port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎨 Pokrećem Frontend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server\client'; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Serveri pokrenuti!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Otvori http://localhost:3000 u browseru" -ForegroundColor Yellow
Write-Host "   Pritisni CTRL+C da zaustaviš ovaj prozor" -ForegroundColor Gray

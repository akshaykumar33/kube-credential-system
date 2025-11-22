# cleanup-dev.ps1
Write-Host "Stopping all Node processes and freeing dev ports..."
taskkill /F /IM node.exe
npx kill-port 3000 3001 3002 3003
Write-Host "Done! Ports 3000-3003 are free."

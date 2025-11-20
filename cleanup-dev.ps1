# cleanup-dev.ps1
Write-Host "Stopping all Node processes and freeing dev ports..."
taskkill /F /IM node.exe
npx kill-port 7000 7001 7002 7003
Write-Host "Done! Ports 7000-7003 are free."

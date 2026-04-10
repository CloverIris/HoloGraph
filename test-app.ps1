# Test script to verify HoloGraph app launches correctly
$appPath = "C:\HoloGraph\release\win-unpacked\HoloGraph.exe"

if (Test-Path $appPath) {
    Write-Host "Found HoloGraph at: $appPath" -ForegroundColor Green
    Write-Host "Starting app..." -ForegroundColor Cyan
    
    # Start the app and capture console output
    $process = Start-Process -FilePath $appPath -PassThru -WindowStyle Normal
    
    Write-Host "App started with PID: $($process.Id)" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "If the app shows a blue screen, check the console output for errors." -ForegroundColor Yellow
    Write-Host "The app should display a knowledge graph with 5 nodes." -ForegroundColor Cyan
} else {
    Write-Host "App not found at: $appPath" -ForegroundColor Red
}

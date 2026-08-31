# Start Both Forensic Agent and Web Dashboard concurrently
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " SMART FORENSIC SYSTEM — FULL STACK DEVELOPER RUNNER  " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$RootPath = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path $RootPath

Write-Host "[1/3] Verifying ADB & Environment..." -ForegroundColor Gray
& powershell -File "$RootPath\scripts\check-adb.ps1"

Write-Host "[2/3] Initializing Database & Seed Data..." -ForegroundColor Gray
Set-Location -Path "$RootPath\apps\api"
& npx prisma db push --skip-generate
& npx tsx src/db/seed.ts

Set-Location -Path $RootPath
Write-Host "[3/3] Starting Local Agent (Port 3001) & Web Dashboard (Port 3000)..." -ForegroundColor Green
& npm run dev

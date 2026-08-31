# Start Local Forensic Agent and API Daemon
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " STARTING SMART FORENSIC LOCAL AGENT (PORT 3001)     " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

$RootPath = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path "$RootPath\apps\api"

Write-Host "Running Prisma Database Migrations / Sync..." -ForegroundColor Gray
& npx prisma db push --skip-generate
& npx tsx src/db/seed.ts

Write-Host "Launching Local Forensic Agent API..." -ForegroundColor Green
& npm run dev
